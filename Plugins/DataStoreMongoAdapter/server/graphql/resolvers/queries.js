import PenPal from "meteor/penpal";

export default {
  async getMongoDataStoreConfiguration(root, args, context) {
    let connectionString =
      PenPal.DataStore.fetch("MongoDataStore", "Configuration", {})[0]
        ?.connectionString ?? "";
    return { connectionString };
  }
};
