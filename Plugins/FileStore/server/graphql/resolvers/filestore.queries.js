import PenPal from "#penpal/core";

// Import the shared logger from plugin.js
import { FileStoreLogger as logger } from "../../plugin.js";

export default {
  getBuckets: async (parent, args, context) => {
    try {
      return await PenPal.FileStore.ListBuckets();
    } catch (error) {
      logger.error("Error getting buckets:", error);
      throw new Error("Failed to retrieve buckets");
    }
  },

  getFiles: async (parent, { bucket, limit = 50, offset = 0 }, context) => {
    try {
      const options = { limit, offset };
      return await PenPal.FileStore.ListFiles(bucket, options);
    } catch (error) {
      logger.error("Error getting files:", error);
      throw new Error("Failed to retrieve files");
    }
  },

  getFileInfo: async (parent, { bucket, fileName }, context) => {
    try {
      return await PenPal.FileStore.GetFileInfo(bucket, fileName);
    } catch (error) {
      logger.error("Error getting file info:", error);
      throw new Error("Failed to retrieve file information");
    }
  },

  generateUploadUrl: async (
    parent,
    { bucket, fileName, contentType },
    context
  ) => {
    try {
      const options = { contentType, expirySeconds: 3600 }; // 1 hour expiry
      return await PenPal.FileStore.GenerateUploadUrl(
        bucket,
        fileName,
        options
      );
    } catch (error) {
      logger.error("Error generating upload URL:", error);
      throw new Error("Failed to generate upload URL");
    }
  },

  generateDownloadUrl: async (
    parent,
    { bucket, fileName, expirySeconds = 3600 },
    context
  ) => {
    try {
      const options = { expirySeconds };
      return await PenPal.FileStore.GenerateDownloadUrl(
        bucket,
        fileName,
        options
      );
    } catch (error) {
      logger.error("Error generating download URL:", error);
      throw new Error("Failed to generate download URL");
    }
  },

  getFileStoreAnalytics: async (parent, args, context) => {
    return PenPal.FileStore._Analytics;
  },
};
