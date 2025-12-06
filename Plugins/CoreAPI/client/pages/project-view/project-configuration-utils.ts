// Utility functions for summarizing plugin configurations in project view

// Registry for plugin-specific summarizers
// Plugins can register their own summarization functions:
// Example: registerPluginSummarizer("MyPlugin", (config) => { /* custom logic */ });
const pluginSummarizers = new Map<string, (config: any) => string>();

// Registry for plugin-specific detailed summarizers
// Plugins can register their own detailed summarization functions:
// Example: registerPluginDetailedSummarizer("MyPlugin", (config) => { /* custom logic */ });
const pluginDetailedSummarizers = new Map<string, (config: any) => string>();

/**
 * Register a custom summarizer for a specific plugin
 * @param {string} pluginName - Name of the plugin
 * @param {function} summarizerFn - Function that takes config and returns summary string
 */
export const registerPluginSummarizer = (pluginName: string, summarizerFn: (config: any) => string) => {
  pluginSummarizers.set(pluginName.toLowerCase(), summarizerFn);
};

/**
 * Register a custom detailed summarizer for a specific plugin
 * @param {string} pluginName - Name of the plugin
 * @param {function} detailedSummarizerFn - Function that takes config and returns detailed summary string
 */
export const registerPluginDetailedSummarizer = (pluginName: string, detailedSummarizerFn: (config: any) => string) => {
  pluginDetailedSummarizers.set(pluginName.toLowerCase(), detailedSummarizerFn);
};

/**
 * Generate a human-readable summary of a plugin configuration
 * @param {string} pluginName - Name of the plugin (e.g., "Nmap", "HttpX")
 * @param {object} config - The plugin's configuration object
 * @returns {string} Human-readable summary
 */
export const summarizePluginConfig = (pluginName: string, config: any): string => {
  if (!config) return "No configuration";

  // Check if there's a registered summarizer for this plugin
  const summarizer = pluginSummarizers.get(pluginName.toLowerCase());
  if (summarizer) {
    return summarizer(config);
  }

  // Fall back to generic summary
  return generateGenericSummary(config);
};

/**
 * Generate a generic configuration summary based on common patterns
 * @param {object} config - The plugin configuration object
 * @returns {string} Human-readable summary
 */
const generateGenericSummary = (config: any): string => {
  const summaries = [];

  // Look for common configuration patterns

  // Port scanning patterns
  if (config.scan) {
    if (config.scan.fast) {
      const fast = config.scan.fast;
      if (fast.use_top_ports && fast.top_ports) {
        summaries.push(`Fast: Top ${fast.top_ports} ports`);
      } else if (fast.tcp_ports?.length > 0 || fast.udp_ports?.length > 0) {
        const portCount =
          (fast.tcp_ports?.length || 0) + (fast.udp_ports?.length || 0);
        summaries.push(`Fast: ${portCount} custom ports`);
      }
    }

    if (config.scan.detailed) {
      const detailed = config.scan.detailed;
      if (detailed.use_top_ports && detailed.top_ports) {
        summaries.push(`Detailed: Top ${detailed.top_ports} ports`);
      } else if (
        detailed.tcp_ports?.length > 0 ||
        detailed.udp_ports?.length > 0
      ) {
        const portCount =
          (detailed.tcp_ports?.length || 0) + (detailed.udp_ports?.length || 0);
        summaries.push(`Detailed: ${portCount} custom ports`);
      }
    }
  }

  // HTTP/web patterns
  if (config.status_codes?.length > 0) {
    summaries.push(`${config.status_codes.length} status codes`);
  }

  if (config.content_types?.length > 0) {
    summaries.push(`${config.content_types.length} content types`);
  }

  if (config.tech_detect) {
    summaries.push("Tech detection");
  }

  // Directory scanning patterns
  if (config.mode) {
    summaries.push(`Mode: ${config.mode}`);
  }

  if (config.wordlist) {
    const wordlistName = config.wordlist.split("/").pop();
    summaries.push(`Wordlist: ${wordlistName}`);
  }

  // Screenshot patterns
  if (config.resolution) {
    summaries.push(`Resolution: ${config.resolution}`);
  }

  // Performance patterns
  if (config.threads) {
    summaries.push(`${config.threads} threads`);
  }

  if (config.timeout) {
    summaries.push(`Timeout: ${config.timeout}s`);
  }

  // Generic array/object counting for unknown configurations
  if (summaries.length === 0) {
    const keys = Object.keys(config);
    if (keys.length > 0) {
      const keySummaries = keys.slice(0, 3).map((key) => {
        const value = config[key];
        if (Array.isArray(value)) {
          return `${value.length} ${key}`;
        } else if (typeof value === "object" && value !== null) {
          const subKeys = Object.keys(value);
          return `${subKeys.length} ${key} settings`;
        } else {
          return `${key}: ${String(value)}`;
        }
      });
      summaries.push(...keySummaries);
    }
  }

  return summaries.length > 0 ? summaries.join(" | ") : "Default configuration";
};

/**
 * Get the plugin display name from plugin ID
 */
export const getPluginDisplayName = (pluginId: string): string => {
  // Extract plugin name from ID (e.g., "Nmap@0.1.0" -> "Nmap")
  return pluginId.split("@")[0];
};

/**
 * Get detailed configuration summary for a specific plugin
 */
export const getDetailedConfigSummary = (pluginId: string, config: any): string => {
  if (!config) return "No additional details";

  const pluginName = pluginId.split("@")[0].toLowerCase();

  // Check if there's a registered detailed summarizer for this plugin
  const detailedSummarizer = pluginDetailedSummarizers.get(pluginName);
  if (detailedSummarizer) {
    return detailedSummarizer(config);
  }

  // Fall back to generic detailed summary
  return getGenericDetailedSummary(config);
};


/**
 * Get detailed configuration summary for any plugin
 * This is a generic implementation that works with common configuration patterns
 */
const getGenericDetailedSummary = (config: any): string => {
  const details = [];

  // Show timing and performance settings
  if (config.timeout) {
    details.push(`Timeout: ${config.timeout}s`);
  }
  if (config.threads) {
    details.push(`${config.threads} threads`);
  }

  // Show output preferences
  if (config.quiet || config.silent) {
    details.push("Quiet mode");
  }
  if (config.json || config.json_output) {
    details.push("JSON output");
  }

  // Show any additional configuration details
  const entries = Object.entries(config).slice(0, 2);
  const additionalDetails = entries
    .filter(
      ([key]) =>
        ![
          "timeout",
          "threads",
          "quiet",
          "silent",
          "json",
          "json_output",
        ].includes(key)
    )
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${value.length} ${key}`;
      } else if (typeof value === "object" && value !== null) {
        const subKeys = Object.keys(value);
        return `${subKeys.length} ${key} settings`;
      } else {
        return `${key}: ${String(value)}`;
      }
    });

  details.push(...additionalDetails);

  return details.length > 0
    ? details.join(" • ")
    : "Using standard configuration settings";
};

/**
 * Format plugin configuration for display
 */
export const formatPluginConfig = (pluginName: string, config: any): any => {
  return {
    name: getPluginDisplayName(pluginName),
    summary: summarizePluginConfig(getPluginDisplayName(pluginName), config),
    config: config,
  };
};
