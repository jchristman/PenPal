import fs from "fs";
import path from "path";
import PenPal from "#penpal/core";

// File-level logger that can be imported by other files
export const HttpXLogger = PenPal.Utils.BuildLogger("HttpX");

/**
 * Parse httpx JSON output and upsert service enrichments
 */
export const parseAndUpsertResults = async (
  project_id,
  services_data,
  output_data
) => {
  try {
    HttpXLogger.log("Parsing HttpX results for project:", project_id);

    if (!output_data || output_data.trim() === "") {
      HttpXLogger.warn("No output data to parse");
      return;
    }

    // Parse each line as JSON (httpx outputs one JSON object per line)
    const lines = output_data
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const http_results = [];

    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        http_results.push(result);
      } catch (parseError) {
        HttpXLogger.warn(
          "Failed to parse JSON line:",
          line,
          parseError.message
        );
      }
    }

    HttpXLogger.log(`Parsed ${http_results.length} HTTP results`);

    if (http_results.length === 0) {
      HttpXLogger.warn("No valid HTTP results found in output");
      return;
    }

    // Convert HttpX results to enrichment format
    const enrichment_updates = http_results.map((result) => ({
      // Service identification using natural identifiers
      host:
        result.host || result.input?.replace(/^https?:\/\//, "").split(":")[0],
      port: result.port || (result.url?.includes("https://") ? 443 : 80),
      ip_protocol: "TCP",
      project_id: project_id,

      // HttpX enrichment data
      enrichment: {
        plugin_name: "HttpX",
        url: result.url,
        status_code: result.status_code,
        content_type: result.content_type,
        content_length: result.content_length,
        title: result.title,
        server: result.server,
        tech: result.tech,
        method: result.method,
        scheme: result.scheme,
        path: result.path,
      },
    }));

    // Add enrichments using CoreAPI function
    const result = await PenPal.API.Services.AddEnrichments(enrichment_updates);
    HttpXLogger.log(`Successfully added ${result.accepted.length} enrichments`);

    if (result.rejected?.length > 0) {
      HttpXLogger.warn(
        "Some enrichments were rejected:",
        result.rejected.map(
          (r) => `${r.selector.host}:${r.selector.port} - ${r.error}`
        )
      );
    }

    // Publish MQTT event for discovered HTTP services
    if (result.accepted?.length > 0) {
      const http_services = result.accepted
        .filter(
          (accepted_result) =>
            accepted_result.enrichment?.status_code &&
            accepted_result.enrichment.status_code >= 200 &&
            accepted_result.enrichment.status_code < 400
        )
        .map((accepted_result) => {
          // Find the original service data to get host IP and other details
          const service = services_data.find(
            (s) => s.id === accepted_result.service_id
          );
          return {
            service_id: accepted_result.service_id,
            host: service?.host,
            host_ip: service?.host_ip,
            port: service?.port,
            ip_protocol: service?.ip_protocol,
            project_id: project_id,
            url: accepted_result.enrichment.url,
            status_code: accepted_result.enrichment.status_code,
            title: accepted_result.enrichment.title,
          };
        });

      if (http_services.length > 0) {
        HttpXLogger.log(
          `Publishing ${http_services.length} HTTP services to MQTT`
        );
        await PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.New.HTTPServices, {
          project: project_id,
          http_services: http_services,
        });
      }
    }
  } catch (error) {
    HttpXLogger.error("Error parsing and upserting HttpX results:", error);
    throw error;
  }
};

/**
 * Perform HTTP discovery scan on services
 */
export const performHttpScan = async ({
  services,
  project_id,
  update_job = () => {},
  job_id = null,
}) => {
  try {
    HttpXLogger.log(`Starting HTTP scan for ${services.length} services`);

    if (!services || services.length === 0) {
      HttpXLogger.warn("No services provided for HTTP scan");
      return;
    }

    // Wait for Docker image to be ready
    await PenPal.Docker.WaitForImageReady("penpal:httpx", {
      updateCallback: () => {},
      updateMessage: "Waiting for HttpX Docker image to build...",
      timeout: 120000,
    });

    const outdir_base = "/penpal-plugin-share";
    const outdir = [outdir_base, "httpx", project_id].join(path.sep);

    PenPal.Utils.MkdirP(outdir);

    // Known non-HTTP ports to skip (SSH, FTP, RPC, database ports, etc.)
    const non_http_ports = [
      22, 21, 23, 25, 53, 111, 135, 139, 445, 1433, 3306, 5432, 6379, 27017,
    ];

    // Create target URLs for httpx - try both HTTP and HTTPS for each service
    const targets = [];
    const epoch = PenPal.Utils.Epoch();

    for (const service of services) {
      // Skip known non-HTTP ports (convert port to number for comparison)
      const portNum = parseInt(service.port, 10);
      if (non_http_ports.includes(portNum)) {
        continue;
      }

      // Standard HTTP ports - try HTTP
      if (
        portNum === 80 ||
        portNum === 8080 ||
        portNum === 8000 ||
        portNum === 3000
      ) {
        targets.push(`http://${service.host_ip}:${service.port}`);
      }
      // Standard HTTPS ports - try HTTPS
      else if (
        portNum === 443 ||
        portNum === 8443 ||
        portNum === 8001 ||
        portNum === 3001
      ) {
        targets.push(`https://${service.host_ip}:${service.port}`);
      }
      // For all other ports, try both HTTP and HTTPS (common for custom web services)
      else {
        targets.push(`http://${service.host_ip}:${service.port}`);
        targets.push(`https://${service.host_ip}:${service.port}`);
      }
    }

    if (targets.length === 0) {
      HttpXLogger.warn("No valid HTTP targets created after filtering");
      return {
        success: true,
        message: "No HTTP-capable services to scan",
        results_count: 0,
      };
    }

    // HttpXLogger.log(
    //   `Created ${targets.length} target URLs from ${services.length} services`
    // );

    const targets_file = [outdir, `targets-${epoch}.txt`].join(path.sep);
    const output_file = [outdir, `results-${epoch}.json`].join(path.sep);

    // Ensure directory exists
    if (!fs.existsSync(outdir)) {
      HttpXLogger.warn(`Output directory does not exist, creating: ${outdir}`);
      PenPal.Utils.MkdirP(outdir);
    }

    // Write targets to file
    try {
      const targets_content = targets.join("\n");

      // Ensure parent directory exists
      const parentDir = path.dirname(targets_file);
      if (!fs.existsSync(parentDir)) {
        PenPal.Utils.MkdirP(parentDir);
      }

      // HttpXLogger.log(`Debug: Targets content: ${targets_content}`);
      fs.writeFileSync(targets_file, targets_content, "utf8");

      // Force sync to ensure file is written to disk
      const fd = fs.openSync(targets_file, "r+");
      fs.fsyncSync(fd);
      fs.closeSync(fd);

      // Verify file was written and is readable
      if (!fs.existsSync(targets_file)) {
        throw new Error(`File does not exist after write: ${targets_file}`);
      }

      const stats = fs.statSync(targets_file);
      if (stats.size === 0) {
        throw new Error(`File is empty after write: ${targets_file}`);
      }

      HttpXLogger.log(
        `Created targets file with ${targets.length} URLs (${stats.size} bytes): ${targets_file}`
      );
    } catch (error) {
      HttpXLogger.error(`Error writing targets file: ${error.message}`);
      throw error;
    }

    // Container paths are the same as host paths since volume is mounted at /penpal-plugin-share
    const container_targets_file = targets_file;
    const container_output_file = output_file;

    // Build httpx command
    const httpx_command = [
      `-l ${container_targets_file}`,
      `-o ${container_output_file}`,
      "-json",
      "-title",
      "-tech-detect",
      "-server",
      "-method",
      "-content-type",
      "-content-length",
      "-status-code",
      "-threads 50",
    ].join(" ");

    HttpXLogger.log(`Running httpx command: ${httpx_command}`);

    // Verify file exists and add delay to ensure volume sync
    if (!fs.existsSync(targets_file)) {
      throw new Error(
        `Targets file does not exist before container start: ${targets_file}`
      );
    }

    // Read file back to verify it's accessible
    try {
      const verifyContent = fs.readFileSync(targets_file, "utf8");
      if (!verifyContent || verifyContent.trim().length === 0) {
        throw new Error(
          `Targets file is empty when verifying before container start`
        );
      }
      HttpXLogger.log(
        `Verified targets file is readable (${verifyContent.length} chars) before container start`
      );
    } catch (error) {
      HttpXLogger.error(
        `Failed to verify targets file before container start: ${error.message}`
      );
      throw error;
    }

    // Small delay to ensure Docker volume sync completes
    // Docker volumes can have slight delays in propagation between containers
    await PenPal.Utils.Sleep(500);

    // Final verification before starting container
    const finalStats = fs.statSync(targets_file);
    HttpXLogger.log(
      `Final pre-container check: File exists (${
        finalStats.size
      } bytes, mtime: ${new Date(finalStats.mtime).toISOString()})`
    );

    await update_job(10, "Starting HTTP discovery scan...");

    // Run httpx in Docker container
    const docker_result = await PenPal.Docker.Run({
      image: "penpal:httpx",
      cmd: httpx_command,
      daemonize: true,
      volume: {
        name: "penpal_penpal-plugin-share",
        path: "/penpal-plugin-share",
      },
      network: "penpal_penpal",
    });

    const container_id = docker_result.stdout.trim();
    HttpXLogger.log(`Started httpx container: ${container_id}`);

    await update_job(20, "HTTP discovery scan in progress...");

    // Wait for container to complete with periodic cancellation checks
    while (true) {
      try {
        await PenPal.Docker.Wait(container_id, 10000);
        break; // finished
      } catch (e) {
        if (e.message && e.message.includes("timed out")) {
          if (job_id) {
            const currentJob = await PenPal.Jobs.Get(job_id);
            if (currentJob?.cancellation_request) {
              try {
                await PenPal.Docker.Stop(container_id);
              } catch (stopErr) {
                HttpXLogger.warn(
                  `Error stopping httpx container on cancellation: ${stopErr.message}`
                );
              }
              await PenPal.Jobs.Cancel(job_id);
              try {
                await PenPal.Docker.RemoveContainer(container_id);
              } catch {}
              return;
            }
          }
          // continue waiting
        } else {
          throw e;
        }
      }
    }

    await update_job(80, "HTTP scan complete, processing results...");

    await PenPal.Utils.Sleep(1000);

    // Read and process results
    let output_data = "";
    if (fs.existsSync(output_file)) {
      output_data = fs.readFileSync(output_file, "utf8");
      HttpXLogger.log(`Read ${output_data.length} characters from output file`);
    } else {
      HttpXLogger.warn(`Output file not found: ${output_file}`);
    }

    await update_job(90, "Processing HTTP discovery results...");

    // Parse and upsert results
    if (output_data) {
      await parseAndUpsertResults(project_id, services, output_data);
    }

    await update_job(100, "HTTP discovery scan complete");

    // Clean up files
    try {
      if (fs.existsSync(targets_file)) fs.unlinkSync(targets_file);
      if (fs.existsSync(output_file)) fs.unlinkSync(output_file);
    } catch (cleanupError) {
      HttpXLogger.warn("Error cleaning up files:", cleanupError);
    }

    return {
      success: true,
      message: "HTTP discovery scan completed successfully",
      results_count: output_data ? output_data.trim().split("\n").length : 0,
    };
  } catch (error) {
    HttpXLogger.error("Error in HTTP scan:", error);
    await update_job(100, `HTTP scan failed: ${error.message}`, "failed");

    return {
      success: false,
      error: error.message,
      statusText: "HTTP discovery scan failed",
    };
  }
};

/**
 * Attach a screenshot to an HttpX enrichment
 * This is a convenience function for HttpX-specific screenshot attachments
 */
export const attachScreenshotToHttpXEnrichment = async (
  service_selector,
  screenshot_buffer,
  screenshot_filename,
  metadata = {}
) => {
  return await PenPal.API.Services.AttachScreenshotToEnrichment(
    service_selector,
    "HttpX",
    screenshot_buffer,
    screenshot_filename,
    metadata
  );
};
