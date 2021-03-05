import PenPal from "meteor/penpal";

export default {
  async setMongoDataStoreConfiguration(
    root,
    { configuration: { connectionString = "" } = {} },
    context
  ) {
    PenPal.DataStore.insert(
      "MongoDataStore",
      "Configuration",
      connectionString
    );
    return { connectionString };
  }
};
