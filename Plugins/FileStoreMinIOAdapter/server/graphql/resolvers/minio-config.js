import { CONFIGURATION } from "../../plugin.js";
import PenPal from "#penpal/core";
import { FileStoreMinIOAdapterLogger as logger } from "../../plugin.js";

export default {
  queries: {
    getMinIOFileStoreConfiguration: async (parent, args, context) => {
      return CONFIGURATION.General;
    },
  },

  mutations: {
    setMinIOFileStoreConfiguration: async (parent, { config }, context) => {
      try {
        // Update configuration
        Object.assign(CONFIGURATION.General, config);
        logger.info("MinIO FileStore configuration updated");
        return true;
      } catch (error) {
        logger.error("Error updating MinIO configuration:", error);
        throw new Error("Failed to update MinIO configuration");
      }
    },
  },
};
