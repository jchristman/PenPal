import PenPal from "#penpal/core";
import fs from "fs";
import { AutoReconLogger as logger } from "../../plugin.ts";

// Assetfinder subdomain enumeration tool
export const runexport const runAssetfinderScan = async (Scan = async (domain: string, jobId: string | null = null) => {
  let containerId = null;
  try {
    logger.log(`Running assetfinder scan for ${domain}`);

    // Create output directory structure following findomain pattern
    const outdir_base = "/penpal-plugin-share";
    const outdir = [outdir_base, "autorecon", "assetfinder"].join("/");
    PenPal.Utils.MkdirP(outdir);

    const epoch = PenPal.Utils.Epoch();
    const outputFile = `${outdir}/assetfinder-${domain.replace(
      /\./g,
      "-"
    )}-${epoch}.txt`;

    const containerName = `autorecon-assetfinder-${domain.replace(
      /\./g,
      "-"
    )}-${epoch}`;

    // Container paths are the same as host paths since volume is mounted at /penpal-plugin-share
    const containerOutputFile = outputFile;
    // Use assetfinder with output redirection to file
    // From /tools, access mounted volume with ../penpal-plugin-share
    const relativeOutputFile = containerOutputFile.replace(
      "/penpal-plugin-share/",
      "../penpal-plugin-share/"
    );
    // Use sh -c to ensure proper shell execution of redirection
    const containerCmd = `sh -c "assetfinder ${domain} > ${relativeOutputFile}"`;

    const result = await PenPal.Docker.Run({
      image: "penpal:autorecon",
      name: containerName,
      cmd: containerCmd,
      daemonize: true,
      volume: {
        name: "penpal_penpal-plugin-share",
        path: "/penpal-plugin-share",
      },
      network: "penpal_penpal",
    });

    logger.log(`Docker run result: ${JSON.stringify(result)}`);

    containerId = result.stdout?.trim();
    if (!containerId) {
      throw new Error("No container ID returned from Docker run");
    }

    // Wait for container to complete with timeout
    await PenPal.Docker.Wait(containerId);

    // Small delay to ensure file I/O is complete
    await PenPal.Utils.Sleep(500);

    // Capture container logs as soon as possible
    let containerLogs = { stdout: "", stderr: "" };
    if (containerId && jobId) {
      try {
        const logs = await PenPal.Docker.Logs(containerId);
        containerLogs.stdout = logs.combined || logs.stdout || "";
        containerLogs.stderr = logs.stderr || "";
      } catch (logError: any) {
        logger.warn(`Failed to capture logs from container ${containerId}:`, logError.message);
      }
    }

    // Read output file
    let output = "";
    if (fs.existsSync(outputFile)) {
      output = fs.readFileSync(outputFile, "utf8");
    } else {
      return { domains: [], containerLogs };
    }

    if (!output || output.trim().length === 0) {
      logger.warn("Output file is empty");
      return { domains: [], containerLogs };
    }

    // Container logs already captured above

    // Clean up output file
    try {
      fs.unlinkSync(outputFile);
    } catch (cleanupError: any) {
      logger.warn(
        `Failed to clean up assetfinder output file: ${cleanupError.message}`
      );
    }

    // Parse domains from output
    const domains = output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line.includes(domain) && line !== domain);

    logger.log(
      `assetfinder found ${domains.length} subdomains for ${domain}:`,
      domains
    );

    return { domains, containerLogs };
  } catch (error: any) {
    logger.error(`assetfinder scan failed for ${domain}:`, error);

    // Try to capture logs even on error
    let containerLogs = { stdout: "", stderr: "" };
    if (containerId && jobId) {
      try {
        const logs = await PenPal.Docker.Logs(containerId);
        containerLogs.stdout = logs.combined || logs.stdout || "";
        containerLogs.stderr = logs.stderr || error.message || "";
      } catch (logError: any) {
        logger.warn(
          `Failed to capture error logs from container ${containerId}:`,
          logError.message
        );
        containerLogs.stderr = error.message;
      }
    }

    // Try to clean up container on error
    if (containerId) {
      try {
        await PenPal.Docker.RemoveContainer(containerId);
      } catch (cleanupError: any) {
        logger.warn(
          `Failed to clean up container ${containerId}:`,
          cleanupError.message
        );
      }
    }

    return { domains: [], containerLogs };
  }
};
