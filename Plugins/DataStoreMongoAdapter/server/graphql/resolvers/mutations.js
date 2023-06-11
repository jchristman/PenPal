import { CONFIGURATION } from "../../plugin.js";

export default {
  async setMongoDataStoreConfiguration(
    root,
    { configuration: { General: { connectionString = "" } } = {} },
    context
  ) {
    CONFIGURATION.General.connectionString = connectionString;

    return CONFIGURATION;
  },
};
