import PenPal from "#penpal/core";
import type { PenPalPlugin, PluginLoadResult } from "#penpal/common";
import { loadGraphQLFiles, resolvers } from "./graphql/index.ts";
import * as HttpX from "./httpx.ts";

// File-level logger that can be imported by other files
export const HttpXLogger = PenPal.Utils.BuildLogger("HttpX");

interface BatchArgsItem {
  project: string;
  service_ids: string[];
}

interface BatchArgs extends Array<[BatchArgsItem]> {}

interface UpdateJobFunction {
  (progress: number, statusText: string, status?: string): Promise<void>;
}

export const settings = {
  docker: {
    // Use the official ProjectDiscovery HttpX image
    image: "projectdiscovery/httpx:latest",
    name: "penpal:httpx",
  },
  STATUS_SLEEP: 1000,
  configuration: {
    schema_root: "HttpXConfiguration",
    getter: "getHttpXConfiguration",
    setter: "setHttpXConfiguration",
  },
  datastores: [{ name: "Configuration" }],
};

/**
 * Get effective HttpX configuration for a project
 * Checks project's profile first, then falls back to global config, then defaults
 * @param {string} project_id - Project ID
 * @returns {Promise<object>} Effective HttpX configuration object
 */
const getEffectiveHttpXConfig = async (project_id: string): Promise<any> => {
  try {
    // Get the project to check for profile
    const project = await PenPal.API.Projects.Get(project_id);

    if (project?.profile) {
      // Project has a profile - try to get HttpX config from profile
      try {
        // Ensure DataStore adapters are ready
        if (!PenPal.DataStore || !PenPal.DataStore.AdaptersReady()) {
          HttpXLogger.warn(
            `DataStore adapters not ready, using global config for project ${project_id}`
          );
          // Fall through to global config
        } else {
          // Use fetch instead of fetchOne to avoid collection existence issues
          const profiles = await PenPal.DataStore.fetch("Base", "Profiles", {
            id: project.profile,
          });
          const profile = profiles?.[0];

          if (profile?.plugin_configs) {
            // Find HttpX configuration in profile
            const httpXPluginId = Object.keys(PenPal.LoadedPlugins).find(
              (pid) => PenPal.LoadedPlugins[pid]?.name === "HttpX"
            );

            // Try multiple matching strategies
            const profileConfig = profile.plugin_configs.find((pc) => {
              if (!pc.plugin_id) return false;
              if (pc.plugin_id === httpXPluginId) return true;
              if (pc.plugin_id.startsWith("HttpX@")) return true;
              if (pc.plugin_id === "HttpX") return true;
              return false;
            });

            if (profileConfig?.configuration) {
              HttpXLogger.log(
                `Using profile "${profile.name}" configuration for project ${project_id}`
              );
              return profileConfig.configuration;
            } else {
              HttpXLogger.log(
                `Profile "${profile.name}" found but no HttpX config, falling back to global`
              );
            }
          }
        }
      } catch (e) {
        HttpXLogger.warn(
          `Failed to load profile config, falling back to global: ${e.message}`
        );
      }
    }

    // Fall back to global configuration
    const existing = await PenPal.DataStore.fetch("HttpX", "Configuration", {});
    if (existing?.[0]) {
      HttpXLogger.log(`Using global configuration for project ${project_id}`);
      return existing[0];
    }

    // Fall back to default settings
    HttpXLogger.log(`Using default configuration for project ${project_id}`);
    return null;
  } catch (e) {
    HttpXLogger.error(`Error getting effective config: ${e.message}`);
    return null;
  }
};

/**
 * Check if HttpX plugin is enabled for a project
 * Checks project's profile first, then falls back to global config
 * @param {string} project_id - Project ID
 * @returns {Promise<boolean>} True if plugin is enabled, false otherwise
 */
const isHttpXEnabled = async (project_id: string): Promise<boolean> => {
  try {
    const config = await getEffectiveHttpXConfig(project_id);
    // If config is null, use defaults (enabled by default)
    if (!config) return true;
    // Default to enabled if config doesn't specify enabled field
    return config?.ui?.enabled !== false;
  } catch (e) {
    HttpXLogger.warn(`Error checking if HttpX is enabled: ${e.message}`);
    // Default to enabled on error
    return true;
  }
};

const start_http_service_scan_batch = async (batchedArgs: BatchArgs): Promise<void> => {
  HttpXLogger.log("HttpX: Processing batched events:", batchedArgs.length);

  // Collect all unique service IDs and projects from batched arguments
  const projectServiceMap = new Map();

  for (const [{ project, service_ids }] of batchedArgs) {
    if (!projectServiceMap.has(project)) {
      projectServiceMap.set(project, new Set());
    }
    service_ids.forEach((id) => projectServiceMap.get(project).add(id));
  }

  // Process each project's services in bulk
  for (const [project, serviceIdSet] of projectServiceMap) {
    const service_ids = Array.from(serviceIdSet);

    // Check if HttpX is enabled for this project
    const enabled = await isHttpXEnabled(project);
    if (!enabled) {
      HttpXLogger.log(`HttpX is disabled for project ${project}, skipping HTTP scan`);
      continue;
    }

    HttpXLogger.log(
      "HttpX: New Services for project",
      project,
      ":",
      service_ids
    );

    // Get the service details
    const services = await PenPal.API.Services.GetMany(service_ids);

    HttpXLogger.log(`Retrieved ${services.length} services for analysis`);

    // Filter for HTTP-capable services
    const network_services = services.filter(
      (service) =>
        service.port &&
        service.ip_protocol.toLowerCase() === "tcp" &&
        service.status === "open"
    );

    if (network_services.length > 0) {
      // Create a job for this HTTP scan
      const job = await PenPal.Jobs.Create({
        name: `HTTP Discovery Scan (${network_services.length} services)`,
        plugin: "HttpX",
        progress: 0,
        statusText: "Starting HTTP discovery scan...",
        project_id: project,
      });

      const update_job = async (progress, statusText, status = "running") => {
        await PenPal.Jobs.Update(job.id, {
          progress,
          statusText,
          status:
            status === "failed"
              ? PenPal.Jobs.Status.FAILED
              : progress === 100
              ? PenPal.Jobs.Status.DONE
              : PenPal.Jobs.Status.RUNNING,
        });
      };

      try {
        // Enrich services with host IP and hostnames information
        const hosts_map = {};
        for (const service of network_services) {
          if (service.host && !hosts_map[service.host]) {
            const host_data = await PenPal.API.Hosts.Get(service.host);
            hosts_map[service.host] = host_data;
            service.host_ip = host_data?.ip_address;
            service.host_hostnames = host_data?.hostnames || [];
          } else if (hosts_map[service.host]) {
            service.host_ip = hosts_map[service.host].ip_address;
            service.host_hostnames = hosts_map[service.host].hostnames || [];
          }
        }

        // Perform HTTP enrichment scan with job tracking
        await HttpX.performHttpScan({
          project_id: project,
          services: network_services,
          update_job,
        });
      } catch (error) {
        HttpXLogger.error("HTTP scan failed:", error);
        await update_job(100, `HTTP scan failed: ${error.message}`, "failed");
        throw error; // Re-throw so ScanQueue can mark its stage as failed
      }
    } else {
      // Create a job to explain why no scan was performed
      const job = await PenPal.Jobs.Create({
        name: `HTTP Discovery Scan (${services.length} services checked)`,
        plugin: "HttpX",
        progress: 100,
        statusText: "HttpX Scan Skipped - No HTTP-capable services found",
        status: PenPal.Jobs.Status.DONE,
        project_id: project,
      });

      HttpXLogger.log(
        `HttpX scan skipped - no HTTP-capable services found out of ${services.length} services checked`
      );
    }
  }
};

const BatchEnqueue = (BatchArgs: BatchArgs): void => {
  // Extract service count and project info for descriptive naming
  const totalServices = BatchArgs.reduce(
    (sum, [{ service_ids }]) => sum + service_ids.length,
    0
  );
  const projects = [...new Set(BatchArgs.map(([{ project }]) => project))];
  const projectCount = projects.length;

  const queueName =
    projectCount === 1
      ? `HttpX Scan (${totalServices} services, Project: ${projects[0]})`
      : `HttpX Scan (${totalServices} services, ${projectCount} projects)`;

  PenPal.ScanQueue.Add(
    async () => await start_http_service_scan_batch(BatchArgs),
    queueName
  );
};

const HttpXPlugin: PenPalPlugin = {
  async loadPlugin(): Promise<PluginLoadResult> {
    const MQTT = await PenPal.MQTT.NewClient();

    // Define HttpX-specific MQTT topics
    PenPal.API.MQTT.Topics.New.HTTPServices = "penpal/httpx/new/http-services";

    // Subscribe to new services discovered by other plugins (Nmap, Rustscan, etc.)
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Services,
      PenPal.Utils.BatchFunction(BatchEnqueue, 1000)
    );

    // Register APIs on PenPal object
    PenPal.HttpX = {
      PerformScan: HttpX.performHttpScan,
      ParseResults: HttpX.parseAndUpsertResults,
      AttachScreenshot: HttpX.attachScreenshotToHttpXEnrichment,
    };

    // Register test handlers if Tester plugin is available
    if (PenPal.Tester && PenPal.Tester.RegisterHandler) {
      // Test handler for HTTP scanning
      PenPal.Tester.RegisterHandler(
        "HttpX",
        async () => {
          try {
            // Test basic HTTP scanning functionality
            const testServices = [
              {
                host_ip: "httpbin.org",
                port: 80,
                ip_protocol: "TCP",
                status: "open",
              },
            ];

            const result = await HttpX.performHttpScan({
              project_id: "test",
              services: testServices,
            });

            return {
              success: true,
              message: "HttpX scan completed successfully",
              timestamp: new Date().toISOString(),
              services_scanned: testServices.length,
              results_found: result?.length || 0,
            };
          } catch (error) {
            // Log full error details on server side
            HttpXLogger.error("HttpX Test failed:", error);
            HttpXLogger.error("Stack trace:", error.stack);

            return {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [],
        "HTTP URL Scanner"
      );

      // Test handler that checks if HttpX Docker image is ready
      PenPal.Tester.RegisterHandler(
        "HttpX",
        async () => {
          try {
            const imageName = settings.docker.name;
            const isReady = PenPal.Docker.IsImageReady(imageName);
            const isBuilding = PenPal.Docker.IsImageBuilding(imageName);
            const isFailed = PenPal.Docker.IsImageFailed(imageName);

            return {
              image_name: imageName,
              is_ready: isReady,
              is_building: isBuilding,
              is_failed: isFailed,
              status: isReady
                ? "Ready"
                : isBuilding
                ? "Building"
                : isFailed
                ? "Failed"
                : "Unknown",
              message: isReady
                ? "HttpX Docker image is ready for use"
                : isBuilding
                ? "HttpX Docker image is currently building"
                : isFailed
                ? "HttpX Docker image build failed"
                : "HttpX Docker image status unknown",
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            // Log full error details on server side
            HttpXLogger.error("Docker Image Status check failed:", error);
            HttpXLogger.error("Stack trace:", error.stack);

            return {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [],
        "Check Docker Image Status"
      );

      HttpXLogger.log("Registered test handlers with Tester plugin");
    }

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

export default HttpXPlugin;
