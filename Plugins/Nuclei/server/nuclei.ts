import fs from "fs";
import path from "path";
import PenPal from "#penpal/core";
import { NucleiLogger } from "./plugin.ts";

interface NucleiScanOptions {
  project_id: string;
  http_services: any[];
  update_job?: (progress: number, statusText: string, status?: string) => Promise<void>;
  job_id?: string;
  config?: any;
}

interface NucleiResult {
  vulnerabilities_created?: number;
}

/**
 * Map Nuclei severity to CoreAPI VulnerabilitySeverity
 */
const mapNucleiSeverity = (nucleiSeverity: string): string => {
  const severityMap = {
    critical: "CRITICAL",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
    info: "INFO",
    unknown: "INFO",
  };

  return severityMap[nucleiSeverity?.toLowerCase()] || "INFO";
};

/**
 * Extract CVE IDs from Nuclei template info
 */
const extractCVEIds = (templateInfo: any): string[] => {
  const cveIds = [];

  // Check for CVE IDs in various fields
  if (templateInfo?.cve) {
    if (Array.isArray(templateInfo.cve)) {
      cveIds.push(...templateInfo.cve);
    } else {
      cveIds.push(templateInfo.cve);
    }
  }

  // Also check in tags
  if (templateInfo?.tags) {
    const cveTags = templateInfo.tags.filter((tag) =>
      /^CVE-\d{4}-\d+$/.test(tag)
    );
    cveIds.push(...cveTags);
  }

  // Remove duplicates
  return [...new Set(cveIds)];
};

/**
 * Parse Nuclei JSON output and create vulnerabilities
 */
export const parseAndCreateVulnerabilities = async (
  project_id: string,
  http_services_data: any,
  output_data: string
): Promise<void> => {
  try {
    NucleiLogger.log("Parsing Nuclei results for project:", project_id);

    if (!output_data || output_data.trim() === "") {
      NucleiLogger.warn("No output data to parse");
      return { created: 0, errors: [] };
    }

    // Parse each line as JSON (nuclei outputs one JSON object per line)
    const lines = output_data
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const nuclei_results = [];

    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        nuclei_results.push(result);
      } catch (parseError) {
        NucleiLogger.warn(
          "Failed to parse JSON line:",
          line.substring(0, 100),
          parseError.message
        );
      }
    }

    NucleiLogger.log(`Parsed ${nuclei_results.length} Nuclei findings`);

    if (nuclei_results.length === 0) {
      NucleiLogger.log("No vulnerabilities found in Nuclei output");
      return { created: 0, errors: [] };
    }

    // Get all hosts for the project to map IPs to host IDs
    const hosts = await PenPal.API.Hosts.GetManyByProjectID(project_id);
    const hostMap = new Map(hosts.map((h) => [h.ip_address, h.id]));

    // Get all services for the project to map URLs to service IDs
    const services = await PenPal.API.Services.GetManyByProjectID(project_id);
    const serviceMap = new Map();

    for (const service of services) {
      const host = hosts.find((h) => h.id === service.host);
      if (host) {
        const key = `${host.ip_address}:${service.port}`;
        serviceMap.set(key, service.id);
      }
    }

    const vulnerabilities = [];
    const errors = [];

    for (const result of nuclei_results) {
      try {
        // Extract URL and parse host/port
        const url = result.matched_at || result.url || result.host;
        if (!url) {
          NucleiLogger.warn("Nuclei result missing URL:", result);
          continue;
        }

        // Parse URL to extract host and port
        let host_ip, port;
        try {
          const urlObj = new URL(url);
          host_ip = urlObj.hostname;
          port = urlObj.port
            ? parseInt(urlObj.port)
            : urlObj.protocol === "https:"
            ? 443
            : 80;
        } catch (urlError) {
          // If URL parsing fails, try to extract from host field
          host_ip = result.host || result.ip || url.split(":")[0];
          port = result.port || 80;
        }

        // Find matching host
        const host_id = hostMap.get(host_ip);
        if (!host_id) {
          NucleiLogger.warn(
            `Host not found for IP ${host_ip} in project ${project_id}`
          );
          continue;
        }

        // Find matching service (optional)
        const service_key = `${host_ip}:${port}`;
        const service_id = serviceMap.get(service_key);

        // Extract template information
        const template_id =
          result.template_id || result["template-id"] || "unknown";
        const template_name =
          result.template || result.name || result.info?.name || template_id;
        const template_info = result.info || {};
        const severity = mapNucleiSeverity(
          result.severity || template_info?.severity || "info"
        );
        const description =
          template_info?.description ||
          template_info?.description ||
          result.description ||
          `Vulnerability detected: ${template_name}`;

        // Extract CVE IDs
        const cveIds = extractCVEIds(template_info);

        // Extract CVSS score if available
        let cvssScore = null;
        if (template_info?.classification?.cvss_score) {
          cvssScore = parseFloat(template_info.classification.cvss_score);
        } else if (template_info?.cvss_score) {
          cvssScore = parseFloat(template_info.cvss_score);
        }

        // Build references array
        const references = [];
        if (template_info?.reference) {
          if (Array.isArray(template_info.reference)) {
            references.push(...template_info.reference);
          } else {
            references.push(template_info.reference);
          }
        }
        if (template_info?.links) {
          if (Array.isArray(template_info.links)) {
            references.push(...template_info.links);
          } else {
            references.push(template_info.links);
          }
        }

        // Build metadata object with additional Nuclei data
        const metadata = {
          template_id,
          template_name,
          matched_at: url,
          extracted_results: result.extracted_results || [],
          curl_command: result.curl_command,
          request: result.request,
          response: result.response,
          timestamp: result.timestamp || new Date().toISOString(),
        };

        // Create vulnerability object
        const vulnerability = {
          project: project_id,
          title: template_name,
          description,
          severity,
          cveIds: cveIds.length > 0 ? cveIds : undefined,
          cvssScore: cvssScore || undefined,
          affectedHostIds: [host_id],
          affectedServiceIds: service_id ? [service_id] : undefined,
          discoveredBy: "Nuclei",
          status: "NEW",
          references: references.length > 0 ? references : undefined,
          metadata,
        };

        vulnerabilities.push(vulnerability);
      } catch (error) {
        NucleiLogger.error("Error processing Nuclei result:", error);
        errors.push({ result, error: error.message });
      }
    }

    NucleiLogger.log(
      `Prepared ${vulnerabilities.length} vulnerabilities for project ${project_id}`
    );

    if (vulnerabilities.length === 0) {
      return { created: 0, errors };
    }

    // Insert vulnerabilities using CoreAPI
    const { accepted, rejected } = await PenPal.API.Vulnerabilities.InsertMany(
      vulnerabilities
    );

    NucleiLogger.log(
      `Created ${accepted.length} vulnerabilities, ${rejected.length} rejected`
    );

    if (rejected.length > 0) {
      NucleiLogger.warn("Some vulnerabilities were rejected:", rejected);
      errors.push(...rejected);
    }

    return { created: accepted.length, errors };
  } catch (error) {
    NucleiLogger.error("Error parsing Nuclei results:", error);
    throw error;
  }
};

/**
 * Perform Nuclei vulnerability scan on HTTP services
 */
export const performNucleiScan = async (options: NucleiScanOptions): Promise<NucleiResult> => {
  const {
    http_services,
    project_id,
    update_job = () => {},
    job_id = null,
    config = {},
  } = options;
  let container_id = null; // Declare outside try block for error handling
  try {
    NucleiLogger.log(
      `Starting Nuclei scan for ${http_services.length} HTTP services`
    );

    if (!http_services || http_services.length === 0) {
      NucleiLogger.warn("No HTTP services provided for Nuclei scan");
      return;
    }

    // Wait for Docker image to be ready
    await PenPal.Docker.WaitForImageReady("penpal:nuclei", {
      updateCallback: () => {},
      updateMessage: "Waiting for Nuclei Docker image to build...",
      timeout: 120000,
    });

    const outdir_base = "/penpal-plugin-share";
    const outdir = [outdir_base, "nuclei", project_id].join(path.sep);

    PenPal.Utils.MkdirP(outdir);

    // Create target URLs file for Nuclei
    const targets = http_services.map((service) => service.url);
    const targets_file = [outdir, `targets-${PenPal.Utils.Epoch()}.txt`].join(
      path.sep
    );

    // Write targets to file
    fs.writeFileSync(targets_file, targets.join("\n"));
    NucleiLogger.log(
      `Created targets file with ${targets.length} URLs: ${targets_file}`
    );

    // Create output file path
    const output_file = [outdir, `results-${PenPal.Utils.Epoch()}.json`].join(
      path.sep
    );

    // Convert to container paths
    const container_targets = targets_file.replace(
      outdir_base,
      "/penpal-plugin-share"
    );
    const container_output = output_file.replace(
      outdir_base,
      "/penpal-plugin-share"
    );

    // Build Nuclei command
    const nuclei_command_parts = [
      "-l",
      container_targets,
      "-jle", // JSONL export format (one JSON object per line) - more explicit than -j + -o
      container_output,
      "-rate-limit",
      config.rate_limit || "150",
      "-timeout",
      config.timeout || "10",
      "-retries",
      config.retries || "1",
    ];

    // Add severity filters if configured
    // Support both array format and object format (for backward compatibility)
    let template_severities = config.template_severities;
    if (!template_severities && config.severities) {
      // Convert severities object to array if needed
      const result = [];
      if (config.severities.critical) result.push("critical");
      if (config.severities.high) result.push("high");
      if (config.severities.medium) result.push("medium");
      if (config.severities.low) result.push("low");
      if (config.severities.info) result.push("info");
      template_severities =
        result.length > 0
          ? result
          : ["critical", "high", "medium", "low", "info"];
    }
    if (template_severities && template_severities.length > 0) {
      nuclei_command_parts.push("-s", template_severities.join(","));
    }

    // Add tag filters if configured
    if (config.tags && config.tags.length > 0) {
      nuclei_command_parts.push("-tags", config.tags.join(","));
    }

    // Add excluded templates if configured
    if (config.excluded_templates && config.excluded_templates.length > 0) {
      nuclei_command_parts.push("-etags", config.excluded_templates.join(","));
    }

    const nuclei_command = nuclei_command_parts.join(" ");

    NucleiLogger.log(`Running Nuclei command: ${nuclei_command}`);

    await update_job(10, "Starting Nuclei vulnerability scan...");

    // Run Nuclei in Docker container
    const docker_result = await PenPal.Docker.Run({
      image: "penpal:nuclei",
      cmd: nuclei_command,
      daemonize: true,
      volume: {
        name: "penpal_penpal-plugin-share",
        path: "/penpal-plugin-share",
      },
      network: "penpal_penpal",
    });

    container_id = docker_result.stdout.trim();
    NucleiLogger.log(`Started Nuclei container: ${container_id}`);

    await update_job(30, "Nuclei vulnerability scan in progress...");

    // Wait for container to complete with periodic checks for cancellation
    while (true) {
      try {
        await PenPal.Docker.Wait(container_id, 10000);
        break; // finished
      } catch (e) {
        if (e.message && e.message.includes("timed out")) {
          // Respect cancellation requests
          if (job_id) {
            const currentJob = await PenPal.Jobs.Get(job_id);
            if (currentJob?.cancellation_request) {
              try {
                await PenPal.Docker.Stop(container_id);
              } catch (stopErr) {
                NucleiLogger.warn(
                  `Error stopping Nuclei container on cancellation: ${stopErr.message}`
                );
              }
              await PenPal.Jobs.Cancel(job_id);
              try {
                await PenPal.Docker.RemoveContainer(container_id);
              } catch {
                // ignore
              }
              return;
            }
          }
          // continue waiting
        } else {
          throw e;
        }
      }
    }

    await update_job(80, "Scan complete, processing results...");

    await PenPal.Utils.Sleep(1000);

    // Read and parse results
    let results_data = "";
    if (fs.existsSync(output_file)) {
      results_data = fs.readFileSync(output_file, "utf8");
    } else {
      NucleiLogger.log("No results file found - no vulnerabilities detected");
      await update_job(100, "Nuclei scan complete - no vulnerabilities found");

      // Capture logs even when no results
      let container_logs = { stdout: "", stderr: "" };
      try {
        const logs = await PenPal.Docker.Logs(container_id);
        container_logs.stdout = logs.combined || logs.stdout || "";
        container_logs.stderr = logs.stderr || "";
      } catch (logError) {
        NucleiLogger.warn(
          `Failed to capture logs from container ${container_id}:`,
          logError.message
        );
      }

      if (job_id) {
        try {
          await PenPal.Jobs.Update(job_id, {
            stdout: container_logs.stdout,
            stderr: container_logs.stderr,
          });
        } catch (updateError) {
          NucleiLogger.warn(
            `Failed to attach logs to job ${job_id}:`,
            updateError.message
          );
        }
      }

      return { vulnerabilities_created: 0 };
    }

    // Parse results and create vulnerabilities
    const parse_result = await parseAndCreateVulnerabilities(
      project_id,
      http_services,
      results_data
    );

    await update_job(
      100,
      `Nuclei scan complete - ${parse_result.created} vulnerabilities found`
    );

    // Capture container logs before removing container
    let container_logs = { stdout: "", stderr: "" };
    try {
      const logs = await PenPal.Docker.Logs(container_id);
      container_logs.stdout = logs.combined || logs.stdout || "";
      container_logs.stderr = logs.stderr || "";
    } catch (logError) {
      NucleiLogger.warn(
        `Failed to capture logs from container ${container_id}:`,
        logError.message
      );
    }

    // Attach logs to job if job_id is provided
    if (job_id) {
      try {
        await PenPal.Jobs.Update(job_id, {
          stdout: container_logs.stdout,
          stderr: container_logs.stderr,
        });
      } catch (updateError) {
        NucleiLogger.warn(
          `Failed to attach logs to job ${job_id}:`,
          updateError.message
        );
      }
    }

    NucleiLogger.log(
      `Nuclei scan completed: ${parse_result.created} vulnerabilities created`
    );

    return {
      vulnerabilities_created: parse_result.created,
      errors: parse_result.errors,
    };
  } catch (error) {
    NucleiLogger.error("Nuclei scan failed:", error);

    // Try to capture logs even on error (container_id is now in outer scope)
    if (container_id && job_id) {
      try {
        const logs = await PenPal.Docker.Logs(container_id);
        await PenPal.Jobs.Update(job_id, {
          stdout: logs.combined || logs.stdout || "",
          stderr: logs.stderr || error.message || "",
        });
      } catch (logError) {
        NucleiLogger.warn(`Failed to capture logs on error:`, logError.message);
      }
    }

    throw error;
  }
};
