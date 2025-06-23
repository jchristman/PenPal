import PenPal from "#penpal/core";
import path from "path";
import fs from "fs";

import { settings } from "./plugin.js";

const parseHttpXOutput = (output) => {
  const lines = output.split("\n").filter((line) => line.trim());
  const results = [];

  for (const line of lines) {
    try {
      // httpx JSON output contains URL, status code, and other information
      const result = JSON.parse(line);
      if (result.url) {
        results.push({
          url: result.url,
          status_code: result.status_code || result["status-code"],
          content_type: result.content_type || result["content-type"],
          content_length: result.content_length || result["content-length"],
          title: result.title,
          server: result.server,
          tech: result.tech,
          method: result.method || "GET",
          scheme: result.scheme,
          host: result.host,
          port: result.port,
          path: result.path || "/",
        });
      }
    } catch (e) {
      // Skip invalid JSON lines
      console.log(`[HttpX] Skipping invalid JSON line: ${line}`);
    }
  }

  return results;
};

export const parseAndUpsertResults = async (
  project_id,
  services_data,
  output_data
) => {
  // Parse the httpx output
  const http_results = parseHttpXOutput(output_data);

  console.log(`[HttpX] Found ${http_results.length} HTTP services`);

  if (http_results.length > 0) {
    console.log(`[HttpX] Discovered services:`);
    http_results.forEach((result, i) => {
      console.log(
        `  ${i + 1}. ${result.url} (${result.status_code}) from ${
          result.host
        }:${result.port}`
      );
    });
  }

  if (http_results.length === 0) {
    return;
  }

  // Convert each HTTP result to enrichment data
  // The CoreAPI will handle service matching internally
  const enrichment_updates = http_results.map((result) => {
    const enrichment = {
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
    };

    // Use host/port/protocol for service matching - CoreAPI handles the lookup
    return {
      host: result.host,
      port: result.port,
      ip_protocol: "TCP", // HttpX results are always TCP
      project_id: project_id, // Required for proper service lookup across projects
      enrichment,
    };
  });

  // Add enrichments using the new CoreAPI function
  if (enrichment_updates.length > 0) {
    console.log(
      `[HttpX] Adding enrichments to ${enrichment_updates.length} discovered services`
    );
    const result = await PenPal.API.Services.AddEnrichments(enrichment_updates);

    console.log(
      `[HttpX] Successfully added ${
        result.accepted?.length || 0
      } enrichments, ${result.rejected?.length || 0} failed`
    );

    if (result.rejected && result.rejected.length > 0) {
      console.log(
        `[HttpX] Some enrichments were rejected (services not found):`,
        result.rejected.map(
          (r) =>
            `${r.selector?.host || "unknown"}:${
              r.selector?.port || "unknown"
            } - ${r.error || "unknown error"}`
        )
      );
    }
  }
};

export const performHttpScan = async ({
  project_id,
  services = [],
  outdir_base = "/penpal-plugin-share",
  outfile_prefix = "httpx-output",
  update_job = async () => {},
  job_id = null,
}) => {
  const outdir = [outdir_base, "httpx", project_id].join(path.sep);
  PenPal.Utils.MkdirP(outdir);

  // Build list of targets from services
  const targets = [];
  const input_hosts = new Set();
  for (const service of services) {
    const host = service.host_ip || service.host?.ip_address;
    if (host && service.port) {
      // Add both HTTP and HTTPS variants
      targets.push(`http://${host}:${service.port}`);
      if (service.port !== 80) {
        targets.push(`https://${host}:${service.port}`);
      }
      input_hosts.add(host);
    }
  }

  console.log(`[HttpX] Input hosts: ${Array.from(input_hosts).join(", ")}`);
  console.log(
    `[HttpX] Input targets: ${targets.slice(0, 5).join(", ")}${
      targets.length > 5 ? "..." : ""
    }`
  );

  if (targets.length === 0) {
    console.log("[HttpX] No targets to scan");
    await update_job(100.0, "No targets found");
    return;
  }

  // Create targets file for httpx (using volume mount like nmap)
  let targets_file = [outdir, `targets-${PenPal.Utils.Epoch()}.txt`].join(
    path.sep
  );
  fs.writeFileSync(targets_file, targets.join("\n"));

  let output_file = [
    outdir,
    `${outfile_prefix}-${PenPal.Utils.Epoch()}.json`,
  ].join(path.sep);

  // Use paths that work with the volume mount
  let container_targets_file = targets_file.replace(
    outdir_base,
    "/penpal-plugin-share"
  );
  let container_output_file = output_file.replace(
    outdir_base,
    "/penpal-plugin-share"
  );

  await PenPal.Utils.AsyncNOOP();

  // Build httpx command
  const httpx_command = [
    `httpx`,
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
    // "-silent",
  ].join(" ");

  console.log(`[HttpX] Running httpx ${httpx_command}`);
  console.log(`[HttpX] Scanning ${targets.length} targets`);

  // Check if Docker image is ready before running
  await PenPal.Docker.WaitForImageReady(settings.docker.name, {
    updateCallback: update_job,
    updateMessage: "Waiting for HttpX Docker image to build...",
  });

  // Run httpx in Docker
  let result = await PenPal.Docker.Run({
    image: settings.docker.name,
    cmd: httpx_command,
    daemonize: true,
    volume: {
      name: "penpal_penpal-plugin-share",
      path: outdir_base,
    },
    network: "penpal_penpal",
  });

  // Parse the container ID from the result
  const container_id = result.stdout.trim();
  console.log(`[HttpX] Starting httpx: ${container_id}`);

  // Wait for the container to finish
  while (true) {
    try {
      const result = await PenPal.Utils.AwaitTimeout(
        async () => await PenPal.Docker.Wait(container_id),
        5000 // 5 second timeout
      );
      break;
    } catch (e) {
      // Update progress while waiting
      await update_job(50, "Scanning HTTP services...");
    }
  }

  console.log(`[HttpX] httpx finished: ${container_id}`);

  // Mark the job as completed
  if (job_id) {
    await PenPal.Jobs.Update(job_id, {
      status: PenPal.Jobs.Status.DONE,
      progress: 100.0,
      statusText: "HTTP scan complete",
    });
  }

  await update_job(100.0, "HTTP scan complete");

  console.log("[HttpX] Waiting for file write to complete...");
  await PenPal.Utils.Sleep(1000);

  // Read and parse the output
  let output_data = "";
  try {
    output_data = fs.readFileSync(output_file, "utf8");
  } catch (e) {
    console.error(`[HttpX] Failed to read output file: ${e.message}`);
    return;
  }

  // Clean up container
  await PenPal.Docker.RemoveContainer(container_id);

  // Parse and upsert results
  try {
    await parseAndUpsertResults(project_id, services, output_data);
  } catch (error) {
    console.error("[HttpX] Failed to parse and upsert results:", error);
    console.error("[HttpX] Stack trace:", error.stack);
    // Don't throw - let the scan complete even if enrichment fails
  }
};
