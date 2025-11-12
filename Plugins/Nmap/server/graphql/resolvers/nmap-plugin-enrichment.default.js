import PenPal from "#penpal/core";

// Import the shared logger from plugin.js
import { NmapLogger } from "../../plugin.js";

const isNmapPluginEnrichment = (obj) => {
  if (obj.plugin_name === "Nmap") {
    return "NmapPluginEnrichment";
  }
  return null;
};

PenPal.Utils.RunAfterImport(async () => {
  await PenPal.Utils.Sleep(500); // TODO: need to come up with a more elegant way to handle this

  // Add safety checks
  if (!PenPal.API) {
    NmapLogger.warn(
      "PenPal.API not available, skipping interface resolver registration"
    );
    return;
  }

  if (!PenPal.API.InterfaceResolvers) {
    NmapLogger.warn(
      "PenPal.API.InterfaceResolvers not available, skipping registration"
    );
    return;
  }

  if (!PenPal.API.InterfaceResolvers.PluginEnrichments) {
    PenPal.API.InterfaceResolvers.PluginEnrichments = [];
  }

  PenPal.API.InterfaceResolvers.PluginEnrichments.push(isNmapPluginEnrichment);
});

export default {
  NmapPluginEnrichment: {
    service(obj) {
      return obj.service || obj.data?.service;
    },
    fingerprint(obj) {
      return obj.fingerprint || obj.data?.fingerprint;
    },
    product(obj) {
      return obj.product || obj.data?.product;
    },
    version(obj) {
      return obj.version || obj.data?.version;
    },
    extra_info(obj) {
      return obj.extra_info || obj.data?.extra_info;
    },
    // Remove files resolver - handled by PluginEnrichment interface resolver
    data(obj) {
      // Return all properties except plugin_name and files as the data object
      const { plugin_name, files, ...data } = obj;
      return data;
    },
  },
};
