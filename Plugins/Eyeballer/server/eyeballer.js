import fs from "fs";
import path from "path";
import PenPal from "#penpal/core";

// File-level logger that can be imported by other files
export const EyeballerLogger = PenPal.Utils.BuildLogger("Eyeballer");

/**
 * Download screenshot from FileStore and save to local path
 */
const downloadScreenshot = async (bucket, key, local_path) => {
  try {
    EyeballerLogger.log(`Downloading screenshot: ${bucket}/${key}`);
    const fileBuffer = await PenPal.FileStore.DownloadFile(bucket, key);
    fs.writeFileSync(local_path, fileBuffer);
    EyeballerLogger.log(`Screenshot downloaded to: ${local_path}`);
    return true;
  } catch (error) {
    EyeballerLogger.error(`Error downloading screenshot: ${error.message}`);
    throw error;
  }
};

/**
 * Run Eyeballer classification on a screenshot
 */
const classifyScreenshot = async ({
  screenshot_path,
  weights_path = "/app/weights/bishop-fox-pretrained-v3.h5",
  output_dir,
}) => {
  try {
    EyeballerLogger.log(`Classifying screenshot: ${screenshot_path}`);

    // Ensure output directory exists
    PenPal.Utils.MkdirP(output_dir);

    // Convert screenshot path to container path
    const container_screenshot = screenshot_path.replace(
      "/penpal-plugin-share",
      "/penpal-plugin-share"
    );

    // Weights file is inside the container at /app/weights/, not in shared volume
    // So we use the path as-is (it's already a container path)
    const container_weights = weights_path;

    // Eyeballer predict command format:
    // python3 eyeballer.py --weights WEIGHTS.h5 predict SCREENSHOT.png
    const eyeballer_command = [
      "--weights",
      container_weights,
      "predict",
      container_screenshot,
    ].join(" ");

    EyeballerLogger.log(`Running Eyeballer command: ${eyeballer_command}`);

    // Run Eyeballer in Docker container
    const docker_result = await PenPal.Docker.Run({
      image: "penpal:eyeballer",
      cmd: eyeballer_command,
      daemonize: true,
      volume: {
        name: "penpal_penpal-plugin-share",
        path: "/penpal-plugin-share",
      },
      network: "penpal_penpal",
    });

    const container_id = docker_result.stdout.trim();
    EyeballerLogger.log(`Started Eyeballer container: ${container_id}`);

    // Wait for container to complete
    try {
      await PenPal.Docker.Wait(container_id);
      EyeballerLogger.log(`Container ${container_id} completed`);
    } catch (waitError) {
      EyeballerLogger.error(`Error waiting for container ${container_id}: ${waitError.message}`);
      // Try to get logs even if wait failed
    }

    // Check container exit code
    try {
      const containerInfo = await PenPal.Docker.Raw(`inspect ${container_id} --format='{{.State.ExitCode}}'`);
      const exitCode = parseInt(containerInfo.stdout?.trim() || "1");
      if (exitCode !== 0) {
        EyeballerLogger.warn(`Container ${container_id} exited with code ${exitCode}`);
      }
    } catch (inspectError) {
      EyeballerLogger.warn(`Could not inspect container exit code: ${inspectError.message}`);
    }

    // Eyeballer outputs to stdout, so we need to capture logs
    const logs = await PenPal.Docker.Logs(container_id);
    const stdout = logs.combined || logs.stdout || "";
    const stderr = logs.stderr || "";

    EyeballerLogger.log(`Container stdout length: ${stdout.length}, stderr length: ${stderr.length}`);
    if (stdout) {
      EyeballerLogger.log(`Container stdout: ${stdout.substring(0, 500)}`);
    }
    if (stderr) {
      EyeballerLogger.warn(`Container stderr: ${stderr.substring(0, 500)}`);
    }

    // Parse Eyeballer output
    // Eyeballer outputs predictions in CSV format or JSON format
    // Format: filename,old_looking,login_page,webapp,custom_404,parked_domain
    // Or JSON format with confidence scores
    const predictions = parseEyeballerOutput(stdout || stderr, path.basename(screenshot_path));
    EyeballerLogger.log(`Parsed predictions:`, JSON.stringify(predictions));

    // Clean up container
    try {
      await PenPal.Docker.RemoveContainer(container_id);
    } catch (cleanupError) {
      EyeballerLogger.warn(`Error cleaning up container: ${cleanupError.message}`);
    }

    return predictions;
  } catch (error) {
    EyeballerLogger.error(`Error classifying screenshot: ${error.message}`);
    throw error;
  }
};

/**
 * Parse Eyeballer output into structured predictions
 * Eyeballer outputs Python repr() format with numpy float32 values:
 * [{'filename': '...', 'custom404': np.float32(0.525), 'login': np.float32(0.078), ...}]
 */
const parseEyeballerOutput = (output, filename) => {
  try {
    if (!output || output.trim().length === 0) {
      EyeballerLogger.warn(`No output to parse for ${filename}`);
      return {
        old_looking: false,
        login_page: false,
        webapp: false,
        custom_404: false,
        parked_domain: false,
        confidence_scores: {},
      };
    }

    EyeballerLogger.log(`Parsing output for ${filename}, output length: ${output.length}`);

    // Try to parse Python repr() format first (Eyeballer's actual output format)
    // Format: [{'filename': '...', 'custom404': np.float32(0.525), 'login': np.float32(0.078), ...}]
    // Match the entire dictionary structure - look for lines containing np.float32
    let pythonReprMatch = null;
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes("np.float32") && (line.includes("'custom404'") || line.includes("'login'"))) {
        // Match the dictionary structure - from { to the matching }
        // Use a more robust approach: find the dictionary that contains np.float32
        const dictStart = line.indexOf('{');
        if (dictStart !== -1) {
          // Find the matching closing brace
          let braceCount = 0;
          let dictEnd = dictStart;
          for (let i = dictStart; i < line.length; i++) {
            if (line[i] === '{') braceCount++;
            if (line[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                dictEnd = i + 1;
                break;
              }
            }
          }
          if (dictEnd > dictStart) {
            pythonReprMatch = [line.substring(dictStart, dictEnd)];
            break;
          }
        }
        // Fallback: use regex if brace matching fails
        if (!pythonReprMatch) {
          const regexMatch = line.match(/\{[^}]*np\.float32[^}]*\}/);
          if (regexMatch) {
            pythonReprMatch = regexMatch;
            break;
          }
        }
      }
    }
    
    if (pythonReprMatch) {
      try {
        const reprStr = pythonReprMatch[0];
        EyeballerLogger.log(`Found Python repr() format: ${reprStr.substring(0, 500)}`);
        
        // Extract numpy float32 values using regex
        // Pattern: 'fieldname': np.float32(value) or 'fieldname': value
        const extractFloat = (fieldName) => {
          // Try np.float32(value) format first - handle scientific notation and decimals
          const float32Match = reprStr.match(new RegExp(`'${fieldName}'\\s*:\\s*np\\.float32\\(([0-9.eE+-]+)\\)`, 'i'));
          if (float32Match) {
            return parseFloat(float32Match[1]);
          }
          // Try regular float format
          const floatMatch = reprStr.match(new RegExp(`'${fieldName}'\\s*:\\s*([0-9.eE+-]+)`, 'i'));
          if (floatMatch) {
            return parseFloat(floatMatch[1]);
          }
          return 0.0;
        };

        // Extract confidence scores for each category
        // Field name mapping: custom404 -> custom_404, login -> login_page, oldlooking -> old_looking, parked -> parked_domain, webapp -> webapp
        const confidence_scores = {
          custom_404: extractFloat('custom404'),
          login_page: extractFloat('login'),
          old_looking: extractFloat('oldlooking'),
          parked_domain: extractFloat('parked'),
          webapp: extractFloat('webapp'),
        };

        // Determine boolean values based on threshold (typically > 0.5)
        // Eyeballer uses confidence scores, so we'll consider > 0.5 as True
        const threshold = 0.5;
        const predictions = {
          old_looking: confidence_scores.old_looking > threshold,
          login_page: confidence_scores.login_page > threshold,
          webapp: confidence_scores.webapp > threshold,
          custom_404: confidence_scores.custom_404 > threshold,
          parked_domain: confidence_scores.parked_domain > threshold,
          confidence_scores: confidence_scores,
        };

        EyeballerLogger.log(`Parsed Python repr() predictions:`, JSON.stringify(predictions));
        return predictions;
      } catch (reprError) {
        EyeballerLogger.warn(`Failed to parse Python repr() format: ${reprError.message}`);
      }
    }

    // Try to parse as JSON
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0]);
        EyeballerLogger.log(`Parsed JSON output:`, JSON.stringify(jsonData));
        return {
          old_looking: jsonData.old_looking || false,
          login_page: jsonData.login_page || false,
          webapp: jsonData.webapp || false,
          custom_404: jsonData.custom_404 || false,
          parked_domain: jsonData.parked_domain || false,
          confidence_scores: jsonData.confidence_scores || {},
        };
      } catch (jsonError) {
        EyeballerLogger.warn(`Failed to parse JSON: ${jsonError.message}`);
      }
    }

    // Try to parse CSV format
    // Format: filename,old_looking,login_page,webapp,custom_404,parked_domain
    const csvLines = output.split("\n").filter((line) => line.trim());
    EyeballerLogger.log(`Found ${csvLines.length} CSV lines to parse`);
    
    for (const line of csvLines) {
      if (line.includes(",")) {
        const parts = line.split(",").map((p) => p.trim());
        EyeballerLogger.log(`Parsing CSV line with ${parts.length} parts: ${line.substring(0, 100)}`);
        
        // Check if this line matches our filename or has the right number of columns
        if (parts.length >= 6) {
          const parsed = {
            old_looking: parts[1] === "True" || parts[1] === "1" || parts[1] === "true",
            login_page: parts[2] === "True" || parts[2] === "1" || parts[2] === "true",
            webapp: parts[3] === "True" || parts[3] === "1" || parts[3] === "true",
            custom_404: parts[4] === "True" || parts[4] === "1" || parts[4] === "true",
            parked_domain: parts[5] === "True" || parts[5] === "1" || parts[5] === "true",
            confidence_scores: {},
          };
          EyeballerLogger.log(`Parsed CSV predictions:`, JSON.stringify(parsed));
          return parsed;
        }
      }
    }

    // If no structured output found, try to extract from text
    // Look for labels in the output
    const labels = {
      old_looking: /old[- ]looking/i.test(output),
      login_page: /login/i.test(output),
      webapp: /webapp/i.test(output),
      custom_404: /custom.*404|404.*custom/i.test(output),
      parked_domain: /parked/i.test(output),
    };

    return {
      ...labels,
      confidence_scores: {},
    };
  } catch (error) {
    EyeballerLogger.warn(`Error parsing Eyeballer output: ${error.message}`);
    // Return default predictions
    return {
      old_looking: false,
      login_page: false,
      webapp: false,
      custom_404: false,
      parked_domain: false,
      confidence_scores: {},
    };
  }
};

/**
 * Process a single screenshot and enrich the service
 */
export const processScreenshot = async ({
  project_id,
  service_id,
  screenshot_bucket,
  screenshot_key,
  update_job = () => {},
}) => {
  try {
    EyeballerLogger.log(
      `Processing screenshot: ${screenshot_bucket}/${screenshot_key} for service ${service_id}`
    );

    const outdir_base = "/penpal-plugin-share";
    const outdir = path.join(outdir_base, "eyeballer", project_id);
    const screenshots_dir = path.join(outdir, "screenshots");
    const output_dir = path.join(outdir, "output");

    PenPal.Utils.MkdirP(screenshots_dir);
    PenPal.Utils.MkdirP(output_dir);

    // Download screenshot from FileStore
    const screenshot_filename = path.basename(screenshot_key);
    const local_screenshot_path = path.join(screenshots_dir, screenshot_filename);

    await downloadScreenshot(screenshot_bucket, screenshot_key, local_screenshot_path);

    await update_job(30, "Running Eyeballer classification...");

    // Classify screenshot
    const predictions = await classifyScreenshot({
      screenshot_path: local_screenshot_path,
      output_dir,
    });

    await update_job(80, "Enriching service with classification results...");

    // Create enrichment with classification results
    const enrichment_data = {
      plugin_name: "Eyeballer",
      old_looking: predictions.old_looking,
      login_page: predictions.login_page,
      webapp: predictions.webapp,
      custom_404: predictions.custom_404,
      parked_domain: predictions.parked_domain,
      confidence_scores: predictions.confidence_scores,
      classified_at: new Date().toISOString(),
      screenshot_bucket: screenshot_bucket,
      screenshot_key: screenshot_key,
    };

    // Add or update enrichment using service_id directly
    EyeballerLogger.log(`Adding enrichment for service_id: ${service_id}`);
    const result = await PenPal.API.Services.UpsertEnrichment(
      { service_id },
      enrichment_data
    );
    EyeballerLogger.log(`Enrichment added successfully:`, JSON.stringify(result));

    await update_job(100, "Classification complete");

    // Clean up local screenshot file
    try {
      if (fs.existsSync(local_screenshot_path)) {
        fs.unlinkSync(local_screenshot_path);
      }
    } catch (cleanupError) {
      EyeballerLogger.warn(`Error cleaning up screenshot: ${cleanupError.message}`);
    }

    return {
      success: true,
      predictions,
      enrichment: result,
    };
  } catch (error) {
    EyeballerLogger.error(`Error processing screenshot: ${error.message}`);
    throw error;
  }
};

/**
 * Process multiple screenshots in batch
 */
export const processScreenshotsBatch = async ({
  project_id,
  screenshots,
  update_job = () => {},
}) => {
  try {
    EyeballerLogger.log(
      `Processing batch of ${screenshots.length} screenshots`
    );

    const results = [];
    const total = screenshots.length;

    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i];
      const progress = Math.round((i / total) * 90); // Reserve 10% for finalization

      await update_job(
        progress,
        `Processing screenshot ${i + 1} of ${total}...`
      );

      try {
        const result = await processScreenshot({
          project_id,
          service_id: screenshot.service_id,
          screenshot_bucket: screenshot.screenshot_bucket,
          screenshot_key: screenshot.screenshot_key,
          update_job: (p, text) => {
            // Nested progress updates
            const overallProgress = progress + Math.round((p / 100) * (90 / total));
            update_job(overallProgress, text);
          },
        });

        results.push({
          success: true,
          screenshot_key: screenshot.screenshot_key,
          ...result,
        });
      } catch (error) {
        EyeballerLogger.error(
          `Error processing screenshot ${screenshot.screenshot_key}: ${error.message}`
        );
        results.push({
          success: false,
          screenshot_key: screenshot.screenshot_key,
          error: error.message,
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await update_job(
      100,
      `Classification complete: ${successful} successful, ${failed} failed`
    );

    return {
      total: screenshots.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    EyeballerLogger.error(`Error processing screenshots batch: ${error.message}`);
    throw error;
  }
};

