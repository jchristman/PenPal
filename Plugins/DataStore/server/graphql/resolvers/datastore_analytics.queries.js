import DataStore from "../../datastore.js";

export default {
  async getDataStoreAnalytics(root, args, context) {
    return DataStore._Analytics;
  }
};
