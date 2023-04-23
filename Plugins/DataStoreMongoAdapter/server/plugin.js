import PenPal from "#penpal/core";
import MongoAdapter from "./adapter.js";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";

const settings = {
  configuration: {
    schema_root: "MongoDataStoreConfiguration",
    getter: "getMongoDataStoreConfiguration",
    setter: "setMongoDataStoreConfiguration",
  },
  datastores: [
    {
      name: "Configuration",
    },
  ],
};

const MongoDataStorePlugin = {
  async loadPlugin() {
    PenPal.DataStore.RegisterAdapter("MongoAdapter", MongoAdapter);
    const types = await loadGraphQLFiles();

    return {
      graphql: {
        types,
        resolvers,
      },
      settings,
    };
  },
};

export default MongoDataStorePlugin;
