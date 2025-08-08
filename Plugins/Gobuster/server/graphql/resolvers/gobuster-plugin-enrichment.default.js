import PenPal from "#penpal/core";

// Import the shared logger from plugin.js
import { GobusterLogger as logger } from "../../plugin.js";

const isGobusterPluginEnrichment = (obj) => {
  if (obj.plugin_name === "Gobuster") {
    return "GobusterPluginEnrichment";
  }
  return null;
};

// Register this resolver with the interface resolver system
PenPal.Utils.RunAfterImport(() => {
  // Ensure PenPal.API exists before accessing it
  if (!PenPal.API) {
    logger.warn(
      "PenPal.API not available, skipping interface resolver registration"
    );
    return;
  }

  if (!PenPal.API.InterfaceResolvers) {
    logger.warn(
      "PenPal.API.InterfaceResolvers not available, skipping registration"
    );
    return;
  }

  if (!PenPal.API.InterfaceResolvers.PluginEnrichments) {
    PenPal.API.InterfaceResolvers.PluginEnrichments = [];
  }
  PenPal.API.InterfaceResolvers.PluginEnrichments.push(
    isGobusterPluginEnrichment
  );
});

export default {
  GobusterPluginEnrichment: {
    directories(obj) {
      return obj.directories || [];
    },
    scan_time(obj) {
      return obj.scan_time;
    },
    data(obj) {
      // Return all properties except plugin_name as the data object
      const { plugin_name, ...data } = obj;
      return data;
    },
  },
};
