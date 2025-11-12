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
      // Check both top-level and data field (for generic query support)
      const screenshotUrl = obj.screenshot_url || obj.data?.screenshot_url;
      if (screenshotUrl) {
        return screenshotUrl;
      }

      // Check both top-level and data field for bucket/key
      const bucket = obj.screenshot_bucket || obj.data?.screenshot_bucket;
      const key = obj.screenshot_key || obj.data?.screenshot_key;

      // If we have bucket and key, fetch the image data via FileStore API
      if (bucket && key) {
        try {
          // Use the FileStore's downloadFile method to get base64 data URL
          const fileBuffer = await PenPal.FileStore.DownloadFile(bucket, key);

          // Get file info for content type
          const fileInfo = await PenPal.FileStore.GetFileInfo(bucket, key);
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
      return obj.screenshot_bucket || obj.data?.screenshot_bucket;
    },
    screenshot_key(obj) {
      return obj.screenshot_key || obj.data?.screenshot_key;
    },
    captured_at(obj) {
      return obj.captured_at || obj.data?.captured_at;
    },
    url(obj) {
      return obj.url || obj.data?.url;
    },
    title(obj) {
      return obj.title || obj.data?.title;
    },
    status_code(obj) {
      return obj.status_code || obj.data?.status_code;
    },
    // Remove files resolver - handled by PluginEnrichment interface resolver
    data(obj) {
      // Return all properties except plugin_name and files as the data object
      const { plugin_name, files, ...data } = obj;
      return data;
    },
  },
};
