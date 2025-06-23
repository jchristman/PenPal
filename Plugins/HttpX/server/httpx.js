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

  if (http_results.length === 0) {
    return;
  }

  // For each HTTP result, create enrichment data for the corresponding service
  const service_updates = [];

  for (const result of http_results) {
    console.log(
      `[HttpX] Trying to match result: host=${result.host}, port=${result.port}`
    );

    // Find the service that matches this result (by host and port)
    const matching_service = services_data.find((service) => {
      const service_host = service.host_ip || service.host?.ip_address;
      console.log(
        `[HttpX] Comparing with service: host=${service_host}, port=${service.port}, id=${service.id}`
      );
      return service_host === result.host && service.port === result.port;
    });

    if (matching_service) {
      console.log(`[HttpX] Found matching service: ${matching_service.id}`);
      // Create enrichment data for this service
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

      // Add the enrichment to the service
      const existing_enrichments = matching_service.enrichments || [];
      const updated_enrichments = [...existing_enrichments, enrichment];

      service_updates.push({
        id: matching_service.id,
        enrichments: updated_enrichments,
      });
    } else {
      console.log(
        `[HttpX] No matching service found for host=${result.host}, port=${result.port}`
      );
    }
  }

  // Update services with new enrichments
  if (service_updates.length > 0) {
    await PenPal.API.Services.UpsertMany(service_updates);
    console.log(
      `[HttpX] Updated ${service_updates.length} services with HTTP enrichments`
    );
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
  for (const service of services) {
    const host = service.host_ip || service.host?.ip_address;
    if (host && service.port) {
      // Add both HTTP and HTTPS variants
      targets.push(`http://${host}:${service.port}`);
      if (service.port !== 80) {
        targets.push(`https://${host}:${service.port}`);
      }
    }
  }

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
    "-timeout 10",
    "-retries 2",
    "-threads 50",
    "-silent",
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
  await parseAndUpsertResults(project_id, services, output_data);
};
