import PenPal from "#penpal/core";
import MongoAdapter from "./adapter.js";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const settings = {
  configuration: {
    schema_root: "MongoDataStoreConfiguration",
    getter: "getMongoDataStoreConfiguration",
    setter: "setMongoDataStoreConfiguration",
  },
};

// We have to hold the configuration for database connection string in memory or on-disk,
// on disk not yet implemented so it needs to be tracked live
export const CONFIGURATION = {
  General: {
    connectionString: "NotYetImplemented",
  },
};

const MongoDataStorePlugin = {
  async loadPlugin() {
    await PenPal.Docker.Compose({
      name: "datastore-mongo-adapter",
      docker_compose_path: `${__dirname}/docker-compose.datastore-mongo-adapter.yaml`,
    });
    await MongoAdapter.connect();
    PenPal.DataStore.RegisterAdapter("MongoAdapter", MongoAdapter);

    // Mark adapters as ready after successful connection
    PenPal.DataStore.SetAdaptersReady(true);

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
