import fs from "fs";
import path from "path";
import PenPal from "#penpal/core";

// File-level logger that can be imported by other files
export const GowitnessLogger = PenPal.Utils.BuildLogger("Gowitness");

/**
 * Parse Gowitness results and upload screenshots to FileStore
 */
export const parseAndUploadScreenshots = async (
  project_id,
  http_services_data,
  screenshots_dir
) => {
  try {
    GowitnessLogger.log(
      "Processing Gowitness screenshots for project:",
      project_id
    );

    if (!fs.existsSync(screenshots_dir)) {
      GowitnessLogger.warn("Screenshots directory not found:", screenshots_dir);
      return [];
    }

    // Get list of screenshot files (Gowitness creates .jpeg files)
    const screenshot_files = fs
      .readdirSync(screenshots_dir)
      .filter((file) => file.endsWith(".png") || file.endsWith(".jpeg"))
      .map((file) => path.join(screenshots_dir, file));

    GowitnessLogger.log(`Found ${screenshot_files.length} screenshot files`);

    const enrichment_updates = [];

    for (const screenshot_file of screenshot_files) {
      try {
        const filename = path.basename(screenshot_file);

        // Extract URL from filename (Gowitness uses URL-based naming)
        // Example: https---10.157.1.61-443.jpeg or http---192.168.1.100-80.png
        const url_match = filename.match(/^(https?)---(.+)-(\d+)\.(png|jpeg)$/);

        if (!url_match) {
          GowitnessLogger.warn("Could not parse URL from filename:", filename);
          continue;
        }

        const [, protocol, host_part, port] = url_match;
        const host = host_part.replace(/-/g, ".");
        const url = `${protocol}://${host}:${port}`;

        // Find matching HTTP service by URL (most reliable identifier)
        const matching_service = http_services_data.find(
          (service) => service.url === url
        );

        if (!matching_service) {
          GowitnessLogger.warn(
            "No matching service found for screenshot:",
            filename,
            `- Looking for host=${host}, port=${port}, url=${url}`
          );
          continue;
        }

        // Upload screenshot to FileStore
        const bucket_name = "gowitness-screenshots";
        const file_key = `${project_id}/${filename}`;

        GowitnessLogger.log(`Uploading screenshot: ${file_key}`);

        // Ensure bucket exists
        try {
          await PenPal.FileStore.CreateBucket(bucket_name);
          GowitnessLogger.log(
            `Bucket ${bucket_name} created or already exists`
          );
        } catch (error) {
          GowitnessLogger.warn(
            `Could not create bucket ${bucket_name}:`,
            error.message
          );
        }

        // Determine content type based on file extension
        const file_extension = path.extname(filename).toLowerCase();
        const content_type =
          file_extension === ".jpeg" ? "image/jpeg" : "image/png";

        // Read the screenshot file data
        const file_data = fs.readFileSync(screenshot_file);

        const upload_result = await PenPal.FileStore.UploadFile(
          bucket_name,
          file_key,
          file_data,
          { contentType: content_type }
        );

        GowitnessLogger.log(
          `Screenshot uploaded successfully: ${upload_result?.id}`
        );

        // Create enrichment with screenshot metadata (no URL needed)
        const enrichment = {
          host: matching_service.host_ip, // Use the actual IP address for host matching
          port: matching_service.port,
          ip_protocol: matching_service.ip_protocol || "TCP",
          project_id: project_id,
          enrichment: {
            plugin_name: "Gowitness",
            screenshot_bucket: bucket_name,
            screenshot_key: file_key,
            captured_at: new Date().toISOString(),
            url: matching_service.url,
            title: matching_service.title,
            status_code: matching_service.status_code,
          },
        };

        enrichment_updates.push(enrichment);
      } catch (fileError) {
        GowitnessLogger.error(
          "Error processing screenshot file:",
          screenshot_file,
          fileError
        );
      }
    }

    // Add enrichments using CoreAPI function
    if (enrichment_updates.length > 0) {
      const result = await PenPal.API.Services.AddEnrichments(
        enrichment_updates
      );
      GowitnessLogger.log(
        `Successfully added ${result.accepted.length} Gowitness enrichments`
      );

      if (result.rejected?.length > 0) {
        GowitnessLogger.warn(
          "Some Gowitness enrichments were rejected:",
          result.rejected.map(
            (r) => `${r.selector.host}:${r.selector.port} - ${r.error}`
          )
        );
      }

      return result.accepted;
    }

    return [];
  } catch (error) {
    GowitnessLogger.error(
      "Error parsing and uploading Gowitness screenshots:",
      error
    );
    throw error;
  }
};

/**
 * Perform screenshot capture on HTTP services
 */
export const performScreenshotScan = async ({
  http_services,
  project_id,
  update_job = () => {},
}) => {
  try {
    GowitnessLogger.log(
      `Starting Gowitness screenshot scan for ${http_services.length} HTTP services`
    );

    if (!http_services || http_services.length === 0) {
      GowitnessLogger.warn("No HTTP services provided for screenshot scan");
      return;
    }

    // Wait for Docker image to be ready
    await PenPal.Docker.WaitForImageReady("penpal:gowitness", {
      updateCallback: () => {}, // This isn't working correctly
      updateMessage: "Waiting for Gowitness Docker image to build...",
      timeout: 120000,
    });

    const outdir_base = "/penpal-plugin-share";
    const outdir = [outdir_base, "gowitness", project_id].join(path.sep);
    const screenshots_dir = [outdir, "screenshots"].join(path.sep);

    PenPal.Utils.MkdirP(outdir);
    PenPal.Utils.MkdirP(screenshots_dir);

    // Create target URLs file for Gowitness
    const targets = http_services.map((service) => service.url);

    const targets_file = [outdir, `targets-${PenPal.Utils.Epoch()}.txt`].join(
      path.sep
    );

    // Write targets to file
    fs.writeFileSync(targets_file, targets.join("\n"));
    GowitnessLogger.log(
      `Created targets file with ${targets.length} URLs: ${targets_file}`
    );

    // Convert to container paths
    const container_targets_file = targets_file.replace(
      outdir_base,
      "/penpal-plugin-share"
    );
    const container_screenshots_dir = screenshots_dir.replace(
      outdir_base,
      "/penpal-plugin-share"
    );

    // Build Gowitness command
    const gowitness_command = [
      "scan",
      "file",
      `-f ${container_targets_file}`,
      `-s ${container_screenshots_dir}`,
      "--timeout 30",
      "--threads 5",
    ].join(" ");

    GowitnessLogger.log(`Running Gowitness command: ${gowitness_command}`);

    await update_job(10, "Starting Gowitness screenshot capture...");

    // Run Gowitness in Docker container
    const docker_result = await PenPal.Docker.Run({
      image: "penpal:gowitness",
      cmd: gowitness_command,
      daemonize: true,
      volume: {
        name: "penpal_penpal-plugin-share",
        path: "/penpal-plugin-share",
      },
      network: "penpal_penpal",
    });

    const container_id = docker_result.stdout.trim();
    GowitnessLogger.log(`Started Gowitness container: ${container_id}`);

    await update_job(20, "Gowitness screenshot capture in progress...");

    // Wait for container to complete with timeout
    await PenPal.Docker.Wait(container_id, 600000);

    await update_job(80, "Screenshot capture complete, processing results...");

    await PenPal.Utils.Sleep(1000);

    // Process screenshots and upload to FileStore
    const uploaded_screenshots = await parseAndUploadScreenshots(
      project_id,
      http_services,
      screenshots_dir
    );

    await update_job(100, "Gowitness screenshot scan complete");

    // Clean up files
    // try {
    //   if (fs.existsSync(targets_file)) fs.unlinkSync(targets_file);
    //   // Keep screenshots until they're uploaded, then clean up
    //   if (fs.existsSync(screenshots_dir)) {
    //     const files = fs.readdirSync(screenshots_dir);
    //     files.forEach((file) => {
    //       const filePath = path.join(screenshots_dir, file);
    //       fs.unlinkSync(filePath);
    //     });
    //     fs.rmdirSync(screenshots_dir);
    //   }
    // } catch (cleanupError) {
    //   GowitnessLogger.warn("Error cleaning up files:", cleanupError);
    // }

    return {
      success: true,
      message: "Gowitness screenshot scan completed successfully",
      screenshots_captured: uploaded_screenshots.length,
    };
  } catch (error) {
    GowitnessLogger.error("Error in Gowitness scan:", error);
    await update_job(100, `Gowitness scan failed: ${error.message}`, "failed");

    return {
      success: false,
      error: error.message,
      statusText: "Gowitness screenshot scan failed",
    };
  }
};
