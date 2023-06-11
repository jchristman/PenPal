import { CONFIGURATION } from "../../plugin.js";

export default {
  async getMongoDataStoreConfiguration(root, args, context) {
    return CONFIGURATION;
  },
};
