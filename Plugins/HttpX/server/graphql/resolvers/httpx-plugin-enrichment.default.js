import PenPal from "#penpal/core";

// Import the shared logger from plugin.js
import { HttpXLogger as logger } from "../../plugin.js";

const isHttpXPluginEnrichment = (obj) => {
  if (obj.plugin_name === "HttpX") {
    return "HttpXPluginEnrichment";
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
  PenPal.API.InterfaceResolvers.PluginEnrichments.push(isHttpXPluginEnrichment);
});

export default {
  HttpXPluginEnrichment: {
    url(obj) {
      return obj.url;
    },
    status_code(obj) {
      return obj.status_code;
    },
    content_type(obj) {
      return obj.content_type;
    },
    content_length(obj) {
      return obj.content_length;
    },
    title(obj) {
      return obj.title;
    },
    server(obj) {
      return obj.server;
    },
    tech(obj) {
      return obj.tech;
    },
    method(obj) {
      return obj.method;
    },
    scheme(obj) {
      return obj.scheme;
    },
    path(obj) {
      return obj.path;
    },
    async files(obj, args, context) {
      // Delegate to CoreAPI's getEnrichmentFiles function
      if (!PenPal.API || !PenPal.API.Services) {
        logger.warn(
          "PenPal.API.Services not available for file resolution"
        );
        return [];
      }

      try {
        // Extract service selector from the enrichment context
        // The service selector should be available in the parent resolver context
        const serviceSelector = context.serviceSelector || obj.serviceSelector;
        if (!serviceSelector) {
          logger.warn(
            "No service selector available for file resolution"
          );
          return [];
        }

        const result = await PenPal.API.Services.GetEnrichmentFiles(
          serviceSelector,
          "HttpX"
        );
        return result.files || [];
      } catch (error) {
        logger.error("Error fetching enrichment files:", error);
        return [];
      }
    },
  },
};
