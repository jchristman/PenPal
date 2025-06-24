import PenPal from "#penpal/core";

// Import the shared logger from plugin.js
import { GowitnessLogger as logger } from "../../plugin.js";

const isGowitnessPluginEnrichment = (obj) => {
  if (obj.plugin_name === "Gowitness") {
    return "GowitnessPluginEnrichment";
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
    isGowitnessPluginEnrichment
  );
});

export default {
  GowitnessPluginEnrichment: {
    async screenshot_url(obj) {
      // If the enrichment already has a screenshot_url, return it
      if (obj.screenshot_url) {
        return obj.screenshot_url;
      }

      // If we have bucket and key, fetch the image data via FileStore API
      if (obj.screenshot_bucket && obj.screenshot_key) {
        try {
          // Use the FileStore's downloadFile method to get base64 data URL
          const fileBuffer = await PenPal.FileStore.DownloadFile(
            obj.screenshot_bucket,
            obj.screenshot_key
          );

          // Get file info for content type
          const fileInfo = await PenPal.FileStore.GetFileInfo(
            obj.screenshot_bucket,
            obj.screenshot_key
          );
          const contentType = fileInfo?.contentType || "image/jpeg";
          const base64Data = fileBuffer.toString("base64");

          return `data:${contentType};base64,${base64Data}`;
        } catch (error) {
          logger.error("Error fetching screenshot:", error);
          return null;
        }
      }

      return null;
    },
    screenshot_bucket(obj) {
      return obj.screenshot_bucket;
    },
    screenshot_key(obj) {
      return obj.screenshot_key;
    },
    captured_at(obj) {
      return obj.captured_at;
    },
    url(obj) {
      return obj.url;
    },
    title(obj) {
      return obj.title;
    },
    status_code(obj) {
      return obj.status_code;
    },
    async files(obj, args, context) {
      // Delegate to CoreAPI's getEnrichmentFiles function
      if (!PenPal.API || !PenPal.API.Services) {
        logger.warn("PenPal.API.Services not available for file resolution");
        return [];
      }

      try {
        // Extract service selector from the enrichment context
        const serviceSelector = context.serviceSelector || obj.serviceSelector;
        if (!serviceSelector) {
          logger.warn("No service selector available for file resolution");
          return [];
        }

        const result = await PenPal.API.Services.GetEnrichmentFiles(
          serviceSelector,
          "Gowitness"
        );
        return result.files || [];
      } catch (error) {
        logger.error("Error fetching enrichment files:", error);
        return [];
      }
    },
    data(obj) {
      // Return all properties except plugin_name as the data object
      const { plugin_name, ...data } = obj;
      return data;
    },
  },
};
