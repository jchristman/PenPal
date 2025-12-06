import PenPal from "#penpal/core";

// Import the shared logger from plugin.ts
import { HttpXLogger as logger } from "../../plugin.ts";

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
      return obj.url || obj.data?.url;
    },
    status_code(obj) {
      return obj.status_code || obj.data?.status_code;
    },
    content_type(obj) {
      return obj.content_type || obj.data?.content_type;
    },
    content_length(obj) {
      return obj.content_length || obj.data?.content_length;
    },
    title(obj) {
      return obj.title || obj.data?.title;
    },
    server(obj) {
      return obj.server || obj.data?.server;
    },
    tech(obj) {
      return obj.tech || obj.data?.tech;
    },
    method(obj) {
      return obj.method || obj.data?.method;
    },
    scheme(obj) {
      return obj.scheme || obj.data?.scheme;
    },
    path(obj) {
      return obj.path || obj.data?.path;
    },
    // Remove files resolver - handled by PluginEnrichment interface resolver
    data(obj) {
      // Return all properties except plugin_name and files as the data object
      const { plugin_name, files, ...data } = obj;
      return data;
    },
  },
};
