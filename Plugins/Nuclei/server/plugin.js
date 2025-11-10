import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as Nuclei from "./nuclei.js";
import { severitiesToArray } from "./graphql/resolvers/nuclei.config.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// File-level logger that can be imported by other files
export const NucleiLogger = PenPal.Utils.BuildLogger("Nuclei");

export const settings = {
  docker: {
    name: "penpal:nuclei",
    dockercontext: `${__dirname}/docker-context`,
  },
  configuration: {
    schema_root: "NucleiConfiguration",
    getter: "getNucleiConfiguration",
    setter: "setNucleiConfiguration",
  },
  datastores: [{ name: "Configuration" }],
};

/**
 * Get effective Nuclei configuration for a project
 * Checks project's profile first, then falls back to global config, then defaults
 * @param {string} project_id - Project ID
 * @returns {Promise<object>} Effective Nuclei configuration object
 */
const getEffectiveNucleiConfig = async (project_id) => {
  try {
    // Get the project to check for profile
    const project = await PenPal.API.Projects.Get(project_id);

    if (project?.profile) {
      // Project has a profile - try to get Nuclei config from profile
      try {
        // Ensure DataStore adapters are ready
        if (!PenPal.DataStore || !PenPal.DataStore.AdaptersReady()) {
          NucleiLogger.warn(
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
            // Find Nuclei configuration in profile
            const nucleiPluginId = Object.keys(PenPal.LoadedPlugins).find(
              (pid) => PenPal.LoadedPlugins[pid]?.name === "Nuclei"
            );

            // Try multiple matching strategies
            const profileConfig = profile.plugin_configs.find((pc) => {
              if (!pc.plugin_id) return false;
              if (pc.plugin_id === nucleiPluginId) return true;
              if (pc.plugin_id.startsWith("Nuclei@")) return true;
              if (pc.plugin_id === "Nuclei") return true;
              return false;
            });

            if (profileConfig?.configuration) {
              NucleiLogger.log(
                `Using profile "${profile.name}" configuration for project ${project_id}`
              );
              return profileConfig.configuration;
            } else {
              NucleiLogger.log(
                `Profile "${profile.name}" found but no Nuclei config, falling back to global`
              );
            }
          }
        }
      } catch (e) {
        NucleiLogger.warn(
          `Failed to load profile config, falling back to global: ${e.message}`
        );
      }
    }

    // Fall back to global configuration
    const existing = await PenPal.DataStore.fetch("Nuclei", "Configuration", {});
    if (existing?.[0]) {
      NucleiLogger.log(`Using global configuration for project ${project_id}`);
      return existing[0];
    }

    // Fall back to default settings
    NucleiLogger.log(`Using default configuration for project ${project_id}`);
    return {
      ui: {
        enabled: true,
        severities: {
          critical: true,
          high: true,
          medium: true,
          low: true,
          info: true,
        },
        rate_limit: 150,
        timeout: 10,
        retries: 1,
      },
    };
  } catch (e) {
    NucleiLogger.error(`Error getting effective config: ${e.message}`);
    return {
      ui: {
        enabled: true,
        severities: {
          critical: true,
          high: true,
          medium: true,
          low: true,
          info: true,
        },
        rate_limit: 150,
        timeout: 10,
        retries: 1,
      },
    };
  }
};

/**
 * Check if Nuclei plugin is enabled for a project
 * Checks project's profile first, then falls back to global config
 * @param {string} project_id - Project ID
 * @returns {Promise<boolean>} True if plugin is enabled, false otherwise
 */
const isNucleiEnabled = async (project_id) => {
  try {
    const config = await getEffectiveNucleiConfig(project_id);
    // Default to enabled if config doesn't specify enabled field
    // Check both old format (config.enabled) and new format (config.ui.enabled)
    return config?.ui?.enabled !== false && config?.enabled !== false;
  } catch (e) {
    NucleiLogger.warn(`Error checking if Nuclei is enabled: ${e.message}`);
    // Default to enabled on error
    return true;
  }
};

const start_nuclei_scan_batch = async (batchedArgs) => {
  NucleiLogger.log("Nuclei: Processing batched events:", batchedArgs.length);

  // Collect all unique HTTP services and projects from batched arguments
  const projectHttpServicesMap = new Map();

  for (const [{ project, http_services }] of batchedArgs) {
    if (!projectHttpServicesMap.has(project)) {
      projectHttpServicesMap.set(project, []);
    }
    projectHttpServicesMap.get(project).push(...http_services);
  }

  // Process each project's HTTP services in bulk
  for (const [project, http_services] of projectHttpServicesMap) {
    // Deduplicate HTTP services by URL
    const unique_services = http_services.filter(
      (service, index, array) =>
        array.findIndex((s) => s.url === service.url) === index
    );

    NucleiLogger.log(
      `Nuclei: Processing ${unique_services.length} unique HTTP services for project ${project}`
    );

    // Check if Nuclei is enabled for this project
    const enabled = await isNucleiEnabled(project);
    if (!enabled) {
      NucleiLogger.log(`Nuclei is disabled for project ${project}, skipping scan`);
      continue;
    }

    if (unique_services.length > 0) {
      // Get effective configuration for this project
      const config = await getEffectiveNucleiConfig(project);
      
      // Normalize config format - handle both old and new structure
      const normalizedConfig = {
        ...config,
        // Convert severities object to array if needed
        template_severities: config.ui?.severities 
          ? severitiesToArray(config.ui.severities)
          : config.template_severities || severitiesToArray({ critical: true, high: true, medium: true, low: true, info: true }),
        rate_limit: config.ui?.rate_limit ?? config.rate_limit ?? 150,
        timeout: config.ui?.timeout ?? config.timeout ?? 10,
        retries: config.ui?.retries ?? config.retries ?? 1,
        tags: config.ui?.tags ?? config.tags ?? [],
        excluded_templates: config.ui?.excluded_templates ?? config.excluded_templates ?? [],
      };

      // Create a job for this vulnerability scan
      const job = await PenPal.Jobs.Create({
        name: `Nuclei Vulnerability Scan (${unique_services.length} HTTP services)`,
        plugin: "Nuclei",
        progress: 0,
        statusText: "Starting Nuclei vulnerability scan...",
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
        // Perform Nuclei vulnerability scan with job tracking
        await Nuclei.performNucleiScan({
          project_id: project,
          http_services: unique_services,
          update_job,
          job_id: job.id,
          config: normalizedConfig,
        });
      } catch (error) {
        NucleiLogger.error("Nuclei scan failed:", error);
        await update_job(
          100,
          `Nuclei scan failed: ${error.message}`,
          "failed"
        );
        throw error; // Re-throw so ScanQueue can mark its stage as failed
      }
    } else {
      // Create a job to explain why no scan was performed
      const job = await PenPal.Jobs.Create({
        name: `Nuclei Vulnerability Scan (${http_services.length} services checked)`,
        plugin: "Nuclei",
        progress: 100,
        statusText: "Nuclei Scan Skipped - No valid HTTP services found",
        status: PenPal.Jobs.Status.DONE,
        project_id: project,
      });

      NucleiLogger.log(
        `Nuclei scan skipped - no valid HTTP services found out of ${http_services.length} services checked`
      );
    }
  }
};

const BatchEnqueue = (BatchArgs) => {
  // Extract HTTP service count and project info for descriptive naming
  const totalHttpServices = BatchArgs.reduce(
    (sum, [{ http_services }]) => sum + http_services.length,
    0
  );
  const projects = [...new Set(BatchArgs.map(([{ project }]) => project))];
  const projectCount = projects.length;

  const queueName =
    projectCount === 1
      ? `Nuclei Vulnerability Scan (${totalHttpServices} HTTP services, Project: ${projects[0]})`
      : `Nuclei Vulnerability Scan (${totalHttpServices} HTTP services, ${projectCount} projects)`;

  PenPal.ScanQueue.Add(
    async () => await start_nuclei_scan_batch(BatchArgs),
    queueName
  );
};

const NucleiPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();

    // Subscribe to HTTP services discovered by HttpX plugin
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.HTTPServices,
      PenPal.Utils.BatchFunction(BatchEnqueue, 5000) // 5 second batching
    );

    // Register APIs on PenPal object
    PenPal.Nuclei = {
      PerformScan: Nuclei.performNucleiScan,
      ParseResults: Nuclei.parseAndCreateVulnerabilities,
    };

    // Register test handlers if Tester plugin is available
    if (PenPal.Tester && PenPal.Tester.RegisterHandler) {
      // Test handler for Nuclei vulnerability scanning
      PenPal.Tester.RegisterHandler(
        "Nuclei",
        async () => {
          try {
            // Test basic Nuclei scanning functionality
            const testHttpServices = [
              {
                host: "httpbin.org",
                port: 80,
                url: "http://httpbin.org:80",
                status_code: 200,
                title: "httpbin.org",
              },
            ];

            const result = await Nuclei.performNucleiScan({
              project_id: "test",
              http_services: testHttpServices,
            });

            return {
              success: true,
              message: "Nuclei vulnerability scan completed successfully",
              timestamp: new Date().toISOString(),
              services_scanned: testHttpServices.length,
              vulnerabilities_found: result?.vulnerabilities_created || 0,
            };
          } catch (error) {
            // Log full error details on server side
            NucleiLogger.error("Nuclei Test failed:", error);
            NucleiLogger.error("Stack trace:", error.stack);

            return {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [],
        "Vulnerability Scanner"
      );

      // Test handler that checks if Nuclei Docker image is ready
      PenPal.Tester.RegisterHandler(
        "Nuclei",
        async () => {
          try {
            const isReady = PenPal.Docker.IsImageReady("penpal:nuclei");
            const isBuilding = PenPal.Docker.IsImageBuilding("penpal:nuclei");
            const isFailed = PenPal.Docker.IsImageFailed("penpal:nuclei");

            return {
              image_ready: isReady,
              image_building: isBuilding,
              image_failed: isFailed,
              timestamp: new Date().toISOString(),
              message: isReady
                ? "Nuclei Docker image is ready"
                : isBuilding
                ? "Nuclei Docker image is building"
                : isFailed
                ? "Nuclei Docker image build failed"
                : "Nuclei Docker image status unknown",
            };
          } catch (error) {
            return {
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [],
        "Docker Image Status"
      );

      NucleiLogger.log("Registered test handlers with Tester plugin");
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

export default NucleiPlugin;

