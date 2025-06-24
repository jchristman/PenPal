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
}) => {
  try {
    HttpXLogger.log(`Starting HTTP scan for ${services.length} services`);

    if (!services || services.length === 0) {
      HttpXLogger.warn("No services provided for HTTP scan");
      return;
    }

    // Wait for Docker image to be ready
    await PenPal.Docker.WaitForImageReady("penpal:httpx", {
      updateCallback: update_job,
      updateMessage: "Waiting for HttpX Docker image to build...",
      timeout: 120000,
    });

    const outdir_base = "/penpal-plugin-share";
    const outdir = [outdir_base, "httpx", project_id].join(path.sep);

    PenPal.Utils.MkdirP(outdir);

    // Create target URLs for httpx
    const targets = services.map((service) => {
      const protocol = [80, 8080, 8000, 3000].includes(service.port)
        ? "http"
        : "https";
      return `${protocol}://${service.host_ip}:${service.port}`;
    });

    const targets_file = [outdir, `targets-${PenPal.Utils.Epoch()}.txt`].join(
      path.sep
    );
    const output_file = [outdir, `results-${PenPal.Utils.Epoch()}.json`].join(
      path.sep
    );

    // Write targets to file
    fs.writeFileSync(targets_file, targets.join("\n"));
    HttpXLogger.log(
      `Created targets file with ${targets.length} URLs: ${targets_file}`
    );

    // Convert to container paths
    let container_targets_file = targets_file.replace(
      outdir_base,
      "/penpal-plugin-share"
    );
    let container_output_file = output_file.replace(
      outdir_base,
      "/penpal-plugin-share"
    );

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

    // Wait for container to complete with timeout
    const wait_result = await Promise.race([
      PenPal.Docker.Wait(container_id),
      new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("HttpX scan timeout")), 300000) // 5 minute timeout
      ),
    ]);

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
    // try {
    //   if (fs.existsSync(targets_file)) fs.unlinkSync(targets_file);
    //   if (fs.existsSync(output_file)) fs.unlinkSync(output_file);
    // } catch (cleanupError) {
    //   HttpXLogger.warn("Error cleaning up files:", cleanupError);
    // }

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
