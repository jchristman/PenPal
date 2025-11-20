import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as API from "./api/index.js";
import PenPal from "#penpal/core";

// Initialize logger for this plugin
const logger = PenPal.Utils.BuildLogger("AutoRecon");

import {
  AutoReconTools,
  AutoReconToolDefaults,
  AutoReconConfigOptions,
  AutoReconConfigDefaults,
  AutoReconStatus,
  AutoReconStages,
  AutoReconStageLabels,
} from "../common/autorecon-constants.js";

// File-level logger that can be imported by other files
export const AutoReconLogger = PenPal.Utils.BuildLogger("AutoRecon");

const settings = {
  datastores: [
    {
      name: "AutoReconStagedAssets",
    },
    {
      name: "AutoReconConfigurations",
    },
  ],
  docker: {
    name: "penpal:autorecon",
    dockercontext: `${__dirname}/docker-context`,
  },
  configuration: {
    schema_root: "AutoReconConfiguration",
    getter: "getAutoReconConfiguration",
    setter: "setAutoReconConfiguration",
  },
};

const AutoReconPlugin = {
  async loadPlugin() {
    // Register AutoRecon API
    PenPal.AutoRecon = {
      // Constants
      Tools: AutoReconTools,
      ToolDefaults: AutoReconToolDefaults,
      ConfigOptions: AutoReconConfigOptions,
      ConfigDefaults: AutoReconConfigDefaults,
      Status: AutoReconStatus,
      Stages: AutoReconStages,
      StageLabels: AutoReconStageLabels,

      // Core API methods
      StartScan: API.startAutoReconScan,
      GetScan: API.getAutoReconScan,
      GetScans: API.getAutoReconScans,
      GetStagedAssets: API.getStagedAssets,
      GetStagedAsset: API.getStagedAsset,
      StageAssets: API.stageAssets,
      AcceptStagedAssets: API.acceptStagedAssets,
      RejectStagedAssets: API.rejectStagedAssets,
      GetConfiguration: API.getAutoReconConfiguration,
      UpdateConfiguration: API.updateAutoReconConfiguration,

      // Helper methods
      GetToolStatus: (toolName) => {
        return AutoReconToolDefaults[toolName] || false;
      },

      IsToolEnabled: async (projectId, toolName) => {
        const config = await API.getAutoReconConfiguration(projectId);
        return config?.tools?.[toolName] ?? AutoReconToolDefaults[toolName];
      },

      GetConfigurationOption: async (projectId, optionName) => {
        const config = await API.getAutoReconConfiguration(projectId);
        return (
          config?.options?.[optionName] ?? AutoReconConfigDefaults[optionName]
        );
      },
    };

    AutoReconLogger.log("AutoRecon plugin loaded successfully");

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

export default AutoReconPlugin;
