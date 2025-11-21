import PenPal from "#penpal/core";
import fs from "fs";
import { AutoReconLogger as logger } from "../../plugin.ts";

// Subfinder subdomain enumeration tool
export const runexport const runSubfinderScan = async (Scan = async (domain: string, jobId: string | null = null) => {
  let containerId = null;
  try {
    logger.log(`Running subfinder scan for ${domain}`);

    // Create output directory structure following findomain pattern
    const outdir_base = "/penpal-plugin-share";
    const outdir = [outdir_base, "autorecon", "subfinder"].join("/");
    PenPal.Utils.MkdirP(outdir);

    const epoch = PenPal.Utils.Epoch();
    const outputFile = `${outdir}/subfinder-${domain.replace(
      /\./g,
      "-"
    )}-${epoch}.txt`;

    const containerName = `autorecon-subfinder-${domain.replace(
      /\./g,
      "-"
    )}-${epoch}`;

    // Container paths are the same as host paths since volume is mounted at /penpal-plugin-share
    const containerOutputFile = outputFile;
    // Use subfinder with -d flag for domain and -o flag for output file
    // From /tools, access mounted volume with ../penpal-plugin-share
    const relativeOutputFile = containerOutputFile.replace(
      "/penpal-plugin-share/",
      "../penpal-plugin-share/"
    );
    const containerCmd = `subfinder -d ${domain} -o ${relativeOutputFile}`;

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
        `Failed to clean up subfinder output file: ${cleanupError.message}`
      );
    }

    // Parse domains from output
    // Subfinder outputs subdomains one per line
    const domains = output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line.length > 0 && line !== domain)
      .filter((line) => {
        // More flexible filtering - include any subdomain of the target domain
        return line.includes(domain) || domain.includes(line);
      });

    logger.log(
      `subfinder found ${domains.length} subdomains for ${domain}:`,
      domains
    );

    return { domains, containerLogs };
  } catch (error: any) {
    logger.error(`subfinder scan failed for ${domain}:`, error);

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
