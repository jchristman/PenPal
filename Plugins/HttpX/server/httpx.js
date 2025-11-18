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

    // Build a map of hostnames (IP + domains) to services for matching
    const hostnameToServiceMap = new Map();
    for (const service of services_data) {
      // Map IP address to service
      if (service.host_ip) {
        hostnameToServiceMap.set(service.host_ip.toLowerCase(), service);
      }
      // Map domain names to service
      const hostnames = service.host_hostnames || [];
      for (const hostname of hostnames) {
        // Skip null/undefined/empty hostnames
        if (hostname && typeof hostname === 'string' && hostname.trim()) {
          hostnameToServiceMap.set(hostname.toLowerCase(), service);
        }
      }
    }

    // Convert HttpX results to enrichment format
    const enrichment_updates = http_results.map((result) => {
      // Extract hostname from httpx output (could be IP or domain)
      // httpx JSON output typically has: host, port, url fields
      const result_hostname =
        result.host || result.input?.replace(/^https?:\/\//, "").split(":")[0];
      const port = result.port || (result.url?.includes("https://") ? 443 : 80);

      // Skip if hostname is null/undefined/empty
      if (!result_hostname || typeof result_hostname !== 'string' || !result_hostname.trim()) {
        HttpXLogger.warn(
          `Skipping result with invalid hostname: ${JSON.stringify(result)}`
        );
        return null;
      }

      // Find the matching service by hostname (IP or domain)
      const matching_service = hostnameToServiceMap.get(result_hostname.toLowerCase());
      
      if (!matching_service) {
        HttpXLogger.warn(
          `No matching service found for hostname=${result_hostname}, port=${port}, url=${result.url}`
        );
        return null;
      }

      // Use the service's IP address for enrichment matching (required by CoreAPI)
      const host_ip = matching_service.host_ip;

      HttpXLogger.log(
        `Preparing enrichment for hostname=${result_hostname}, ip=${host_ip}, port=${port}, url=${result.url}`
      );

      return {
        // Service identification using natural identifiers (always use IP for matching)
        host: host_ip, // Use IP address for service matching, not domain name
        port,
        ip_protocol: "TCP",
        project_id: project_id,

        // HttpX enrichment data (preserve original URL which may use domain name)
        enrichment: {
          plugin_name: "HttpX",
          url: result.url, // Preserve original URL (may contain domain name)
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
      };
    }).filter((update) => update !== null); // Remove null entries

    HttpXLogger.log(
      `Prepared ${enrichment_updates.length} enrichment updates for project ${project_id}`
    );

    // Upsert enrichments using CoreAPI function (replaces existing HttpX enrichments)
    // This ensures we don't create duplicates if HttpX runs multiple times
    const upsertResults = [];
    const upsertErrors = [];

    for (const enrichment_update of enrichment_updates) {
      try {
        const { enrichment, ...service_selector } = enrichment_update;
        const result = await PenPal.API.Services.UpsertEnrichment(
          service_selector,
          enrichment
        );
        upsertResults.push(result);
        HttpXLogger.log(
          `Upserted HttpX enrichment: service_id=${result.service_id}, operation=${result.operation}, url=${enrichment.url}`
        );
      } catch (error) {
        upsertErrors.push({ enrichment_update, error: error.message });
        HttpXLogger.warn(
          `Failed to upsert enrichment for host=${enrichment_update.host}, port=${enrichment_update.port}: ${error.message}`
        );
      }
    }

    HttpXLogger.log(
      `Successfully upserted ${upsertResults.length} enrichments, ${upsertErrors.length} failed`
    );

    // Log rejected enrichments
    if (upsertErrors.length > 0) {
      HttpXLogger.warn(
        "Some enrichments were rejected:",
        upsertErrors.map(
          (r) =>
            `host=${r.enrichment_update.host}, port=${r.enrichment_update.port} - ${r.error}`
        )
      );
    }

    // Create a result object compatible with the existing code
    const result = {
      accepted: upsertResults.map((r) => ({
        service_id: r.service_id,
        enrichment: r.enrichment,
      })),
      rejected: upsertErrors,
    };

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
            host_hostnames: service?.host_hostnames || [],
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
  let container_id = null; // Declare outside try block for error handling
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
    // Scan both IP address and domain names (for virtual host magic)
    const targets = [];
    const epoch = PenPal.Utils.Epoch();

    // Helper function to add URLs for a given hostname/IP and port
    const addTargetsForHost = (hostname, port, portNum) => {
      // Standard HTTP ports - try HTTP
      if (
        portNum === 80 ||
        portNum === 8080 ||
        portNum === 8000 ||
        portNum === 3000
      ) {
        targets.push(`http://${hostname}:${port}`);
      }
      // Standard HTTPS ports - try HTTPS
      else if (
        portNum === 443 ||
        portNum === 8443 ||
        portNum === 8001 ||
        portNum === 3001
      ) {
        targets.push(`https://${hostname}:${port}`);
      }
      // For all other ports, try both HTTP and HTTPS (common for custom web services)
      else {
        targets.push(`http://${hostname}:${port}`);
        targets.push(`https://${hostname}:${port}`);
      }
    };

    for (const service of services) {
      // Skip non-TCP services (HTTP/HTTPS only work over TCP)
      const protocol = (service.ip_protocol || "").toLowerCase();
      if (protocol !== "tcp") {
        HttpXLogger.log(
          `Skipping non-TCP service (${protocol}) on port ${service.port} for ${service.host_ip}`
        );
        continue;
      }

      // Skip known non-HTTP ports (convert port to number for comparison)
      const portNum = parseInt(service.port, 10);
      if (non_http_ports.includes(portNum)) {
        continue;
      }

      // Always scan the IP address
      addTargetsForHost(service.host_ip, service.port, portNum);

      // Also scan domain names if available (for virtual host scanning)
      const hostnames = service.host_hostnames || [];
      if (hostnames.length > 0) {
        HttpXLogger.log(
          `Adding ${hostnames.length} domain name(s) for virtual host scanning: ${hostnames.join(", ")}`
        );
        for (const hostname of hostnames) {
          // Only add if hostname is different from IP (avoid duplicates)
          if (hostname !== service.host_ip) {
            addTargetsForHost(hostname, service.port, portNum);
          }
        }
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
      "-vhost", // Enable virtual host probing
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

    container_id = docker_result.stdout.trim();
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

    // Capture container logs before cleaning up
    let container_logs = { stdout: "", stderr: "" };
    try {
      const logs = await PenPal.Docker.Logs(container_id);
      container_logs.stdout = logs.combined || logs.stdout || "";
      container_logs.stderr = logs.stderr || "";
    } catch (logError) {
      HttpXLogger.warn(`Failed to capture logs from container ${container_id}:`, logError.message);
    }

    // Attach logs to job if job_id is provided
    if (job_id) {
      try {
        await PenPal.Jobs.Update(job_id, {
          stdout: container_logs.stdout,
          stderr: container_logs.stderr,
        });
      } catch (updateError) {
        HttpXLogger.warn(`Failed to attach logs to job ${job_id}:`, updateError.message);
      }
    }

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

    // Try to capture logs even on error
    if (container_id && job_id) {
      try {
        const logs = await PenPal.Docker.Logs(container_id);
        await PenPal.Jobs.Update(job_id, {
          stdout: logs.combined || logs.stdout || "",
          stderr: logs.stderr || error.message || "",
        });
      } catch (logError) {
        HttpXLogger.warn(`Failed to capture logs on error:`, logError.message);
      }
    }

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
