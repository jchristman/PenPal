import { CONFIGURATION } from "../../plugin.ts";

export default {
  async getMongoDataStoreConfiguration(_root: any, _args: any, _context: any): Promise<any> {
    return CONFIGURATION;
  },
};
