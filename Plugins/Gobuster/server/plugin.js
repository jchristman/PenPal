import * as Gobuster from "./gobuster.js";

import PenPal from "#penpal/core";

import { loadGraphQLFiles, resolvers } from "./graphql/index.js";

export const GobusterLogger = PenPal.Utils.BuildLogger("Gobuster");

const settings = {
  docker: {
    image: "ghcr.io/oj/gobuster:latest",
  },
  configuration: {
    schema_root: "GobusterConfiguration",
    getter: "getGobusterConfiguration",
    setter: "setGobusterConfiguration",
  },
  datastores: [{ name: "Configuration" }],
};

const start_gobuster_scan_batch = async (batchedArgs) => {
  GobusterLogger.log(
    "Gobuster: Processing batched events:",
    batchedArgs.length
  );

  // Collect all unique HTTP service data from batched arguments
  const projectServiceMap = new Map();

  for (const [{ project, http_services }] of batchedArgs) {
    if (!projectServiceMap.has(project)) {
      projectServiceMap.set(project, []);
    }
    projectServiceMap.get(project).push(...http_services);
  }

  // Process each project's HTTP services in bulk
  for (const [project, http_services] of projectServiceMap) {
    if (http_services.length > 0) {
      GobusterLogger.log(
        `Gobuster: Starting scan for ${http_services.length} HTTP services in project ${project}`
      );

      const job = await PenPal.Jobs.Create({
        name: `Gobuster Directory Scan (${http_services.length} services)`,
        plugin: "Gobuster",
        progress: 0,
        statusText: "Starting directory enumeration...",
        project_id: project,
      });

      const update_job = async (progress, statusText, status = "running") => {
        await PenPal.Jobs.Update(job.id, { progress, statusText, status });
      };

      try {
        // Process HTTP services and ensure they have URLs
        const processedServices = http_services.map((service) => {
          // If URL is already provided (from HttpX), use it
          if (service.url) {
            return {
              ...service,
              host: service.host_ip || service.host,
              port: service.port,
              ip_protocol: service.ip_protocol || "TCP",
            };
          }

          // Otherwise construct URL from service data
          const protocol = [80, 8080, 8000, 3000].includes(service.port)
            ? "http"
            : "https";
          const url = `${protocol}://${service.host_ip || service.host}:${
            service.port
          }`;

          return {
            ...service,
            url,
            host: service.host_ip || service.host,
            port: service.port,
            ip_protocol: service.ip_protocol || "TCP",
          };
        });

        await Gobuster.performGobusterScan({
          http_services: processedServices,
          project_id: project,
          update_job,
          job_id: job.id,
        });
      } catch (error) {
        GobusterLogger.error("Gobuster scan failed:", error);
        await update_job(
          100,
          `Gobuster scan failed: ${error.message}`,
          "failed"
        );
        throw error; // Re-throw so ScanQueue can mark its stage as failed
      }
    }
  }
};

const BatchEnqueue = (BatchArgs) => {
  // Extract service count and project info for descriptive naming
  const totalServices = BatchArgs.reduce(
    (sum, [{ http_services }]) => sum + http_services.length,
    0
  );
  const projects = [...new Set(BatchArgs.map(([{ project }]) => project))];
  const projectCount = projects.length;

  const queueName =
    projectCount === 1
      ? `Gobuster Scan (${totalServices} services, Project: ${projects[0]})`
      : `Gobuster Scan (${totalServices} services, ${projectCount} projects)`;

  PenPal.ScanQueue.Add(
    async () => await start_gobuster_scan_batch(BatchArgs),
    queueName
  );
};

const GobusterPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();

    // Subscribe to HTTP services discovered by HttpX plugin
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.HTTPServices,
      PenPal.Utils.BatchFunction(BatchEnqueue, 1000)
    );

    // Register APIs on PenPal object
    PenPal.Gobuster = {
      PerformScan: Gobuster.performGobusterScan,
      ParseResults: Gobuster.parseAndUpsertResults,
    };

    GobusterLogger.log("Gobuster plugin loaded successfully");

    // Load plugin
    const types = await loadGraphQLFiles();
    return {
      graphql: {
        types,
        resolvers,
      },
      settings,
    };
  },
};

export default GobusterPlugin;
