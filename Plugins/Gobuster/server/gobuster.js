import fs from "fs";
import path from "path";
import PenPal from "#penpal/core";

export const GobusterLogger = PenPal.Utils.BuildLogger("Gobuster");

const extractGobusterProgress = (output) => {
  // Parse progress line: "Progress: 425 / 26585 (1.60%)"
  const progressRegex = /Progress:\s(\d+)\s\/\s(\d+)\s\((\d+\.?\d*)%\)/;
  const progressMatch = output.match(progressRegex);

  if (!progressMatch) {
    return null;
  }

  const stats = {
    current: parseInt(progressMatch[1]),
    total: parseInt(progressMatch[2]),
    percentage: parseFloat(progressMatch[3]),
  };

  return stats;
};

const getGobusterProgress = async (container_id) => {
  let stats = null;
  let foundDirectories = [];

  // Attach to the container to read stdout
  const terminal = await PenPal.Docker.AttachAndReturnDockerChildProcess({
    container: container_id,
  });

  terminal.onData((data) => {
    const lines = data.split("\n");

    for (const line of lines) {
      // Extract progress
      const extractedStats = extractGobusterProgress(line);
      if (extractedStats) {
        stats = extractedStats;
      }

      // Extract found directories - format: "/admin                (Status: 302) [Size: 138] [--> http://opensecurity.io/wp-admin/]"
      const directoryMatch = line.match(
        /^(\S+)\s+\(Status:\s(\d+)\)\s\[Size:\s(\d+)\](?:\s\[--> (.+)\])?/
      );
      if (directoryMatch) {
        foundDirectories.push({
          path: directoryMatch[1],
          status: parseInt(directoryMatch[2]),
          size: parseInt(directoryMatch[3]),
          redirect: directoryMatch[4] || null,
        });
      }
    }
  });

  await PenPal.Utils.Sleep(1500);
  await PenPal.Docker.DetachFromDockerChildProcess(terminal);

  return { stats, foundDirectories };
};

export const parseAndUpsertResults = async (
  project_id,
  http_service,
  directories
) => {
  if (!directories || directories.length === 0) {
    GobusterLogger.log(
      `No directories found for ${http_service.host}:${http_service.port}`
    );
    return;
  }

  const enrichment = {
    plugin_name: "Gobuster",
    directories: directories,
    scan_time: new Date().toISOString(),
  };

  const selector = {
    project_id,
    host: http_service.host,
    port: http_service.port,
    ip_protocol: http_service.ip_protocol,
  };

  try {
    await PenPal.API.Services.AddEnrichments([{ ...selector, enrichment }]);
    GobusterLogger.log(
      `Added ${directories.length} directories to service ${http_service.host}:${http_service.port}`
    );
  } catch (error) {
    GobusterLogger.error(`Failed to add enrichments: ${error.message}`);
  }
};

export const performGobusterScan = async ({
  http_services,
  project_id,
  update_job = () => {},
  job_id = null,
}) => {
  GobusterLogger.log(
    `Starting Gobuster scan for ${http_services.length} services`
  );

  const outdir_base = "/penpal-plugin-share";
  const outdir = path.join(outdir_base, "gobuster", project_id);
  PenPal.Utils.MkdirP(outdir);

  let totalProgress = 0;
  const stepSize = 100 / http_services.length;

  for (let i = 0; i < http_services.length; i++) {
    const service = http_services[i];
    GobusterLogger.log(
      `Scanning service ${i + 1}/${http_services.length}: ${service.url}`
    );

    // Build the command
    const command = `gobuster dir -u ${service.url} -w /wordlists/common.txt -q --no-error -t 20`;

    GobusterLogger.log(`Running: ${command}`);

    try {
      // Run Gobuster in daemonized mode
      const result = await PenPal.Docker.Run({
        image: "ghcr.io/oj/gobuster:latest",
        cmd: command,
        daemonize: true,
        volume: {
          name: "penpal_penpal-plugin-share",
          path: "/penpal-plugin-share",
        },
        binds: [`${path.join(__dirname, "wordlists")}:/wordlists`],
        network: "penpal_penpal",
      });

      const container_id = result.stdout.trim();
      GobusterLogger.log(`Started Gobuster container: ${container_id}`);

      let allFoundDirectories = [];
      let lastProgress = 0;

      // Monitor the container progress
      while (true) {
        try {
          // Wait with timeout to allow progress monitoring
          await PenPal.Docker.Wait(container_id, 10000);
          break; // Container finished
        } catch (e) {
          if (e.message && e.message.includes("timed out")) {
            // Respect cancellation requests
            if (job_id) {
              const currentJob = await PenPal.Jobs.Get(job_id);
              if (currentJob?.cancellation_request) {
                try {
                  await PenPal.Docker.Stop(container_id);
                } catch (stopErr) {
                  GobusterLogger.warn(
                    `Error stopping Gobuster container on cancellation: ${stopErr.message}`
                  );
                }
                await PenPal.Jobs.Cancel(job_id);
                try {
                  await PenPal.Docker.RemoveContainer(container_id);
                } catch {}
                return; // exit scan early
              }
            }
            // Get progress update
            try {
              const { stats, foundDirectories } = await getGobusterProgress(
                container_id
              );

              // Add any new directories found
              if (foundDirectories && foundDirectories.length > 0) {
                allFoundDirectories = [
                  ...allFoundDirectories,
                  ...foundDirectories,
                ];
                GobusterLogger.log(
                  `Found ${foundDirectories.length} new directories (total: ${allFoundDirectories.length})`
                );
              }

              // Update progress if we have stats
              if (stats) {
                const serviceProgress = stats.percentage;
                const overallProgress =
                  totalProgress + (serviceProgress * stepSize) / 100;

                await update_job(
                  overallProgress,
                  `Scanning ${service.url}: ${stats.current}/${stats.total} (${stats.percentage}%) - ${allFoundDirectories.length} directories found`,
                  null
                );

                lastProgress = serviceProgress;
              }
            } catch (progressError) {
              GobusterLogger.warn(
                `Failed to get progress: ${progressError.message}`
              );
            }
          } else {
            // Actual error occurred
            GobusterLogger.error(`Docker wait failed: ${e.message}`);
            throw e;
          }
        }
      }

      // Final progress update for this service
      totalProgress += stepSize;
      await update_job(
        totalProgress,
        `Completed ${service.url} - ${allFoundDirectories.length} directories found`,
        null
      );

      // Parse and upsert results
      if (allFoundDirectories.length > 0) {
        await parseAndUpsertResults(project_id, service, allFoundDirectories);
      }

      // Clean up container
      await PenPal.Docker.RemoveContainer(container_id);
    } catch (error) {
      GobusterLogger.error(`Failed to scan ${service.url}: ${error.message}`);

      // Continue with next service even if this one failed
      totalProgress += stepSize;
      await update_job(
        totalProgress,
        `Failed to scan ${service.url}: ${error.message}`,
        null
      );
    }
  }

  // Mark job as complete
  if (job_id) {
    await PenPal.Jobs.Update(job_id, {
      status: PenPal.Jobs.Status.DONE,
      progress: 100,
      statusText: `Gobuster scan completed for ${http_services.length} services`,
    });
  }

  GobusterLogger.log(
    `Gobuster scan completed for all ${http_services.length} services`
  );
};
