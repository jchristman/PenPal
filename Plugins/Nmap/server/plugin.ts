import PenPal from "#penpal/core";
import type { PenPalPlugin, PluginLoadResult } from "#penpal/common";
import { loadGraphQLFiles, resolvers } from "./graphql/index.ts";
import * as url from "url";
import * as Nmap from "./nmap.ts";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const settings = {
  docker: {
    name: "penpal:nmap",
    dockercontext: `${__dirname}/docker-context`,
  },
  STATUS_SLEEP: 900,
  scan_configurations: {
    fast: {
      name: "Fast Scan",
      description: "Fast scan of the network",
      top_ports: 1000,
      fast_scan: true,
    },
    detailed: {
      name: "Detailed Scan",
      description: "Detailed scan of the network",
      tcp_ports: ["1-65535"],
      udp_ports: [53, 111, 135, "137-139", "161-162"],
    },
  },
  configuration: {
    schema_root: "NmapConfiguration",
    getter: "getNmapConfiguration",
    setter: "setNmapConfiguration",
  },
  datastores: [
    {
      name: "Configuration",
    },
  ],
};

// push and pop out of this work queue for if a job is running. To be implemented
export const work_queue = [];

// File-level logger that can be imported by other files
export const NmapLogger = PenPal.Utils.BuildLogger("Nmap");

interface ScanConfiguration {
  name: string;
  description: string;
  top_ports?: number | null;
  tcp_ports?: string[];
  udp_ports?: (string | number)[];
  fast_scan?: boolean;
}

interface NmapSettings {
  docker: {
    name: string;
    dockercontext: string;
  };
  STATUS_SLEEP: number;
  scan_configurations: {
    fast: ScanConfiguration;
    detailed: ScanConfiguration;
  };
  configuration: {
    schema_root: string;
    getter: string;
    setter: string;
  };
  datastores: Array<{
    name: string;
  }>;
}

/**
 * Check if Nmap plugin is enabled for a project
 * Checks project's profile first, then falls back to global config
 * @param {string} project_id - Project ID
 * @returns {Promise<boolean>} True if plugin is enabled, false otherwise
 */
const isNmapEnabled = async (project_id: string): Promise<boolean> => {
  try {
    const config = await getEffectiveNmapConfig(project_id);
    // If config is null, use defaults (enabled by default)
    if (!config) return true;
    // Default to enabled if config doesn't specify enabled field
    return config?.ui?.enabled !== false;
  } catch (e) {
    NmapLogger.warn(`Error checking if Nmap is enabled: ${e.message}`);
    // Default to enabled on error
    return true;
  }
};

/**
 * Get effective Nmap configuration for a project
 * Checks project's profile first, then falls back to global config, then defaults
 * @param {string} project_id - Project ID
 * @returns {Promise<object>} Effective Nmap configuration object
 */
const getEffectiveNmapConfig = async (project_id: string): Promise<any> => {
  try {
    // Get the project to check for profile
    const project = await PenPal.API.Projects.Get(project_id);

    if (project?.profile) {
      // Project has a profile - try to get Nmap config from profile
      try {
        // Ensure DataStore adapters are ready
        if (!PenPal.DataStore || !PenPal.DataStore.AdaptersReady()) {
          NmapLogger.warn(
            `DataStore adapters not ready, using global config for project ${project_id}`
          );
          // Fall through to global config
        } else {
          // Use fetch instead of fetchOne to avoid collection existence issues
          // fetch returns empty array if collection doesn't exist, which is safe
          const profiles = await PenPal.DataStore.fetch("Base", "Profiles", {
            id: project.profile,
          });
          const profile = profiles?.[0];

          if (profile?.plugin_configs) {
            // Find Nmap configuration in profile
            // Plugin ID format can be "Nmap@0.1.0" or just "Nmap" depending on how it was saved
            const nmapPluginId = Object.keys(PenPal.LoadedPlugins).find(
              (pid) => PenPal.LoadedPlugins[pid]?.name === "Nmap"
            );

            // Try multiple matching strategies
            const profileConfig = profile.plugin_configs.find((pc) => {
              if (!pc.plugin_id) return false;
              // Exact match
              if (pc.plugin_id === nmapPluginId) return true;
              // Starts with "Nmap@"
              if (pc.plugin_id.startsWith("Nmap@")) return true;
              // Exact match to "Nmap"
              if (pc.plugin_id === "Nmap") return true;
              return false;
            });

            if (profileConfig?.configuration) {
              NmapLogger.log(
                `Using profile "${profile.name}" configuration for project ${project_id}`
              );
              return profileConfig.configuration;
            } else {
              NmapLogger.log(
                `Profile "${profile.name}" found but no Nmap config, falling back to global`
              );
            }
          }
        }
      } catch (e) {
        NmapLogger.warn(
          `Failed to load profile config, falling back to global: ${e.message}`
        );
      }
    }

    // Fall back to global configuration
    const existing = await PenPal.DataStore.fetch("Nmap", "Configuration", {});
    if (existing?.[0]) {
      NmapLogger.log(`Using global configuration for project ${project_id}`);
      return existing[0];
    }

    // Fall back to default settings
    NmapLogger.log(`Using default configuration for project ${project_id}`);
    return null;
  } catch (e) {
    NmapLogger.error(`Error getting effective config: ${e.message}`);
    return null;
  }
};

const start_detailed_hosts_scan = async (args: { project: string; host_ids: string[] }): Promise<void> => {
  const { project, host_ids } = args;
  // Create job using the centralized Jobs API
  const job = await PenPal.Jobs.Create({
    name: `Detailed Host Scan for ${host_ids.length} hosts in ${project}`,
    plugin: "Nmap",
    progress: 0.0,
    statusText: "Beginning detailed host scan...",
    project_id: project,
    stages: [
      {
        name: "SYN Stealth Scan",
        plugin: "Nmap",
        progress: 0.0,
        statusText: "Preparing SYN scan...",
        order: 0,
      },
      {
        name: "Service Scan",
        plugin: "Nmap",
        progress: 0.0,
        statusText: "Waiting for SYN scan completion",
        order: 1,
      },
      {
        name: "Script Scan",
        plugin: "Nmap",
        progress: 0.0,
        statusText: "Waiting for Service Scan completion",
        order: 2,
      },
    ],
  });

  const update_job = async (progress, statusText, currentStage = null) => {
    // Use the centralized Jobs API to update progress
    await PenPal.Jobs.UpdateProgress(
      job.id,
      progress,
      statusText,
      currentStage
    );
  };

  const hosts = (await PenPal.API.Hosts.GetMany(host_ids)) ?? [];
  const ips = hosts.map((host) => host.ip_address);
  if (ips.length > 0) {
    // Get effective configuration (profile -> global -> default)
    const config = await getEffectiveNmapConfig(project);
    const detCfg = config?.scan?.detailed;
    const effectiveDetailed = detCfg
      ? detCfg.use_top_ports
        ? {
            top_ports: detCfg.top_ports ?? 1000,
            tcp_ports: [],
            udp_ports: [],
          }
        : {
            top_ports: null,
            tcp_ports: detCfg.tcp_ports ?? ["1-65535"],
            udp_ports: detCfg.udp_ports ?? [],
          }
      : settings.scan_configurations.detailed;

    await Nmap.performScan({
      project_id: project,
      ips,
      update_job,
      job_id: job.id,
      ...effectiveDetailed,
    });
  }
};

const start_initial_networks_scan = async (args: { project: string; network_ids: string[] }): Promise<void> => {
  const { project, network_ids } = args;
  // Create job using the centralized Jobs API
  const job = await PenPal.Jobs.Create({
    name: `Initial Network Scan for ${project}: ${network_ids}`,
    plugin: "Nmap",
    progress: 0.0,
    statusText: "Beginning network scan...",
    project_id: project,
  });

  const update_job = async (progress, statusText) => {
    // Use the centralized Jobs API to update progress
    await PenPal.Jobs.Update(job.id, {
      progress,
      statusText,
    });
  };

  const networks =
    (await PenPal.API.Networks.GetMany(network_ids))?.map(
      (network) =>
        `${network.subnet.network_address}/${network.subnet.subnet_mask}`
    ) ?? [];

  if (networks.length > 0) {
    // Get effective configuration (profile -> global -> default)
    const config = await getEffectiveNmapConfig(project);
    const fastCfg = config?.scan?.fast;
    const effectiveFast = fastCfg
      ? fastCfg.use_top_ports
        ? {
            top_ports: fastCfg.top_ports ?? 1000,
            tcp_ports: [],
            udp_ports: [],
            fast_scan: fastCfg.fast_scan ?? true,
          }
        : {
            top_ports: null,
            tcp_ports: fastCfg.tcp_ports ?? [],
            udp_ports: fastCfg.udp_ports ?? [],
            fast_scan: fastCfg.fast_scan ?? true,
          }
      : settings.scan_configurations.fast;

    for (let network of networks) {
      await Nmap.performScan({
        project_id: project,
        networks: [network],
        update_job,
        job_id: job.id,
        ...effectiveFast,
      });
    }
  }
};

const NmapPlugin: PenPalPlugin = {
  async loadPlugin(): Promise<PluginLoadResult> {
    const MQTT = await PenPal.MQTT.NewClient();

    // Apply any saved configuration from the datastore at startup
    try {
      const existing = await PenPal.DataStore.fetch(
        "Nmap",
        "Configuration",
        {}
      );
      if (existing?.[0]) {
        const cfg = existing[0];
        if (cfg?.ui?.STATUS_SLEEP !== undefined) {
          settings.STATUS_SLEEP = cfg.ui.STATUS_SLEEP;
        }
        if (cfg?.scan) {
          if (cfg.scan.fast) {
            const fast = cfg.scan.fast;
            // Toggle logic: if use_top_ports true, honor top_ports; otherwise use manual ports
            if (fast.use_top_ports) {
              settings.scan_configurations.fast.top_ports =
                fast.top_ports ?? 1000;
              settings.scan_configurations.fast.tcp_ports = [];
              settings.scan_configurations.fast.udp_ports = [];
            } else {
              settings.scan_configurations.fast.top_ports = null;
              settings.scan_configurations.fast.tcp_ports =
                fast.tcp_ports ?? [];
              settings.scan_configurations.fast.udp_ports =
                fast.udp_ports ?? [];
            }
            if (fast.fast_scan !== undefined) {
              settings.scan_configurations.fast.fast_scan = !!fast.fast_scan;
            }
          }
          if (cfg.scan.detailed) {
            const det = cfg.scan.detailed;
            if (det.use_top_ports) {
              settings.scan_configurations.detailed.top_ports =
                det.top_ports ?? 1000;
              settings.scan_configurations.detailed.tcp_ports = [];
              settings.scan_configurations.detailed.udp_ports = [];
            } else {
              settings.scan_configurations.detailed.top_ports = null;
              settings.scan_configurations.detailed.tcp_ports =
                det.tcp_ports ?? ["1-65535"];
              settings.scan_configurations.detailed.udp_ports =
                det.udp_ports ?? [];
            }
          }
        }
      }
    } catch (e) {
      // ignore configuration loading errors at startup
    }

    // Wrap scan functions in ScanQueue
    const queueHostsScan = async (args) => {
      const { project, host_ids } = args;

      // Check if Nmap is enabled for this project
      const enabled = await isNmapEnabled(project);
      if (!enabled) {
        NmapLogger.log(
          `Nmap is disabled for project ${project}, skipping detailed host scan`
        );
        return;
      }

      const queueName = `Nmap Detailed Host Scan (${host_ids.length} hosts), Project: ${project}`;

      // Get effective config to check courtesy_sleep setting
      const config = await getEffectiveNmapConfig(project);
      const courtesySleep = config?.scan?.detailed?.courtesy_sleep ?? 30000; // Default 30 seconds

      // Be polite and wait before adding to the queue (configurable courtesy sleep)
      if (courtesySleep > 0) {
        NmapLogger.log(
          `Waiting ${courtesySleep}ms (courtesy sleep) before queuing detailed scan`
        );
        await PenPal.Utils.Sleep(courtesySleep);
      }

      PenPal.ScanQueue.Add(
        async () => await start_detailed_hosts_scan(args),
        queueName
      );
    };

    const queueNetworksScan = async (args) => {
      const { project, network_ids } = args;

      // Check if Nmap is enabled for this project
      const enabled = await isNmapEnabled(project);
      if (!enabled) {
        NmapLogger.log(
          `Nmap is disabled for project ${project}, skipping network scan`
        );
        return;
      }

      const queueName = `Nmap Quick Network Scan (${network_ids.length} networks), Project: ${project}`;

      PenPal.ScanQueue.Add(
        async () => await start_initial_networks_scan(args),
        queueName
      );
    };

    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Networks,
      queueNetworksScan
    );
    await MQTT.Subscribe(PenPal.API.MQTT.Topics.New.Hosts, queueHostsScan);

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

export default NmapPlugin;
