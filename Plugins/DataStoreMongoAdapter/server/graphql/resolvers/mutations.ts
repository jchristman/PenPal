import { CONFIGURATION } from "../../plugin.ts";

export default {
  async setMongoDataStoreConfiguration(
    _root: any,
    { configuration: { General: { connectionString = "" } } = {} }: any,
    _context: any
  ): Promise<any> {
    CONFIGURATION.General.connectionString = connectionString;

    return CONFIGURATION;
  },
};
