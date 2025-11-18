import * as API from "../../api/index.js";
import { AutoReconLogger as logger } from "../../plugin.js";
import {
  AutoReconToolDefaults,
  AutoReconConfigDefaults,
} from "../../../common/autorecon-constants.js";

export default {
  queries: {
    async getAutoReconConfiguration() {
      try {
        logger.log("Getting AutoRecon configuration");

        const config = await API.getAutoReconConfiguration("global");

        // Merge with defaults
        const mergedConfig = {
          _id: config?._id || "global",
          project_id: "global",
          ui: {
            enabled: true,
            autoStart: false,
            ...config?.ui,
          },
          tools: {
            ...AutoReconToolDefaults,
            ...config?.tools,
          },
          options: {
            ...AutoReconConfigDefaults,
            ...config?.options,
          },
          _ui: config?._ui || buildUIConfig(),
        };

        return mergedConfig;
      } catch (error) {
        logger.error("Failed to get AutoRecon configuration:", error);
        throw error;
      }
    },
  },

  mutations: {
    async setAutoReconConfiguration(parent, { configuration }) {
      try {
        logger.log("Setting AutoRecon configuration", configuration);

        // Validate configuration
        const validatedConfig = validateConfiguration(configuration);

        // Save configuration
        const result = await API.updateAutoReconConfiguration("global", validatedConfig);

        // Return merged config with UI metadata
        return {
          ...result,
          _ui: configuration._ui || buildUIConfig(),
        };
      } catch (error) {
        logger.error("Failed to set AutoRecon configuration:", error);
        throw error;
      }
    },
  },
};

// Helper function to validate configuration
function validateConfiguration(config) {
  const validated = { ...config };

  // Validate UI config
  if (config.ui) {
    validated.ui = {
      enabled: typeof config.ui.enabled === 'boolean' ? config.ui.enabled : true,
      autoStart: typeof config.ui.autoStart === 'boolean' ? config.ui.autoStart : false,
    };
  }

  // Validate tools config
  if (config.tools) {
    validated.tools = {};
    Object.keys(AutoReconToolDefaults).forEach(tool => {
      if (typeof config.tools[tool] === 'boolean') {
        validated.tools[tool] = config.tools[tool];
      }
    });
  }

  // Validate options config
  if (config.options) {
    validated.options = {
      recursive: typeof config.options.recursive === 'boolean' ? config.options.recursive : AutoReconConfigDefaults.recursive,
      scanAllDomains: typeof config.options.scanAllDomains === 'boolean' ? config.options.scanAllDomains : AutoReconConfigDefaults.scanAllDomains,
      timeout: typeof config.options.timeout === 'number' && config.options.timeout > 0 ? config.options.timeout : AutoReconConfigDefaults.timeout,
      maxConcurrency: typeof config.options.maxConcurrency === 'number' && config.options.maxConcurrency > 0 ? config.options.maxConcurrency : AutoReconConfigDefaults.maxConcurrency,
    };
  }

  return validated;
}

// Helper function to build UI configuration
function buildUIConfig() {
  return {
    sections: [
      {
        path: "ui",
        label: "General",
      },
      {
        path: "tools",
        label: "Tools",
      },
      {
        path: "options",
        label: "Scan Options",
      },
    ],
    conditional: [
      {
        path: "options",
        controller: "ui.enabled",
        showWhenTrue: ["recursive", "scanAllDomains", "timeout", "maxConcurrency"],
        showWhenFalse: [],
      },
    ],
  };
}
