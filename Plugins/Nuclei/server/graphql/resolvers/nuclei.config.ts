import PenPal from "#penpal/core";

const DEFAULT_CONFIG = {
  ui: {
    enabled: true,
    severities: {
      critical: true,
      high: true,
      medium: true,
      low: true,
      info: true,
    },
    excluded_templates: [],
    rate_limit: 150,
    timeout: 10,
    retries: 1,
    tags: [],
  },
};

/**
 * Convert severities object to array format for Nuclei command
 * @param {object} severities - Severities object with boolean flags
 * @returns {string[]} Array of severity strings (e.g., ["critical", "high"])
 */
export const severitiesToArray = (severities) => {
  if (!severities || typeof severities !== "object") {
    return ["critical", "high", "medium", "low", "info"];
  }
  const result = [];
  if (severities.critical) result.push("critical");
  if (severities.high) result.push("high");
  if (severities.medium) result.push("medium");
  if (severities.low) result.push("low");
  if (severities.info) result.push("info");
  // If no severities selected, default to all
  return result.length > 0 ? result : ["critical", "high", "medium", "low", "info"];
};

const getStoredConfig = async () => {
  const existing = await PenPal.DataStore.fetch("Nuclei", "Configuration", {});
  if (existing.length === 0) return DEFAULT_CONFIG;
  
  // Deep merge to preserve default values for new fields
  const merged = {
    ...DEFAULT_CONFIG,
    ...existing[0],
    ui: {
      ...DEFAULT_CONFIG.ui,
      ...existing[0].ui,
      severities: {
        ...DEFAULT_CONFIG.ui.severities,
        ...existing[0].ui?.severities,
      },
      // Ensure enabled is always a boolean (defaults to true)
      enabled: existing[0].ui?.enabled !== undefined ? !!existing[0].ui.enabled : DEFAULT_CONFIG.ui.enabled,
    },
  };
  
  // Handle migration from old template_severities array format
  if (existing[0].ui?.template_severities && !existing[0].ui?.severities) {
    const oldSeverities = existing[0].ui.template_severities;
    merged.ui.severities = {
      critical: oldSeverities.includes("critical"),
      high: oldSeverities.includes("high"),
      medium: oldSeverities.includes("medium"),
      low: oldSeverities.includes("low"),
      info: oldSeverities.includes("info"),
    };
  }
  
  return merged;
};

const saveConfig = async (config) => {
  const existing = await PenPal.DataStore.fetch("Nuclei", "Configuration", {});
  if (existing.length > 0) {
    await PenPal.DataStore.updateOne(
      "Nuclei",
      "Configuration",
      { id: `${existing[0].id}` },
      { $set: config }
    );
    return config;
  }
  const inserted = await PenPal.DataStore.insertMany("Nuclei", "Configuration", [
    config,
  ]);
  return inserted?.[0] ?? config;
};

export default {
  queries: {
    async getNucleiConfiguration() {
      const cfg = await getStoredConfig();
      return {
        ...cfg,
        _ui: {
          sections: [
            { path: "ui", label: "General" },
            { path: "ui.severities", label: "Template Severities" },
            { path: "ui.excluded_templates", label: "Excluded Templates" },
            { path: "ui.tags", label: "Tags" },
          ],
          conditional: [
            {
              path: "ui",
              controller: "enabled",
              showWhenTrue: [
                "rate_limit",
                "timeout",
                "retries",
              ],
              showWhenFalse: [],
            },
          ],
        },
      };
    },
  },
  mutations: {
    async setNucleiConfiguration(parent, { configuration }) {
      const current = await getStoredConfig();
      const next = { ...current };
      if (configuration?.ui) {
        if (configuration.ui.enabled !== undefined) {
          next.ui.enabled = !!configuration.ui.enabled;
        }
        if (configuration.ui.severities !== undefined) {
          next.ui.severities = {
            ...DEFAULT_CONFIG.ui.severities,
            ...configuration.ui.severities,
          };
        }
        if (configuration.ui.excluded_templates !== undefined) {
          next.ui.excluded_templates = configuration.ui.excluded_templates;
        }
        if (configuration.ui.rate_limit !== undefined) {
          next.ui.rate_limit = Number(configuration.ui.rate_limit);
        }
        if (configuration.ui.timeout !== undefined) {
          next.ui.timeout = Number(configuration.ui.timeout);
        }
        if (configuration.ui.retries !== undefined) {
          next.ui.retries = Number(configuration.ui.retries);
        }
        if (configuration.ui.tags !== undefined) {
          next.ui.tags = configuration.ui.tags;
        }
      }
      const saved = await saveConfig(next);
      return {
        ...saved,
        _ui: {
          sections: [
            { path: "ui", label: "General" },
            { path: "ui.severities", label: "Template Severities" },
            { path: "ui.excluded_templates", label: "Excluded Templates" },
            { path: "ui.tags", label: "Tags" },
          ],
          conditional: [
            {
              path: "ui",
              controller: "enabled",
              showWhenTrue: [
                "rate_limit",
                "timeout",
                "retries",
              ],
              showWhenFalse: [],
            },
          ],
        },
      };
    },
  },
};
