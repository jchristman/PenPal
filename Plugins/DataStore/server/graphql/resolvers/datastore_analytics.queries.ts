import DataStore from "../../datastore.ts";

export default {
  async getDataStoreAnalytics(_root: any, _args: any, _context: any): Promise<any> {
    return DataStore._Analytics;
  }
};
