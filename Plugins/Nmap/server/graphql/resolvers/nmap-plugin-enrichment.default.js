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
      return obj.service;
    },
    fingerprint(obj) {
      return obj.fingerprint;
    },
    product(obj) {
      return obj.product;
    },
    version(obj) {
      return obj.version;
    },
    extra_info(obj) {
      return obj.extra_info;
    },
    async files(obj, args, context) {
      // Delegate to CoreAPI's getEnrichmentFiles function
      if (!PenPal.API || !PenPal.API.Services) {
        NmapLogger.warn(
          "PenPal.API.Services not available for file resolution"
        );
        return [];
      }

      try {
        // Extract service selector from the enrichment context
        // The service selector should be available in the parent resolver context
        const serviceSelector = context.serviceSelector || obj.serviceSelector;
        if (!serviceSelector) {
          NmapLogger.warn(
            "No service selector available for file resolution"
          );
          return [];
        }

        const result = await PenPal.API.Services.GetEnrichmentFiles(
          serviceSelector,
          "Nmap"
        );
        return result.files || [];
      } catch (error) {
        NmapLogger.error("Error fetching enrichment files:", error);
        return [];
      }
    },
  },
};
