import PenPal from "meteor/penpal";

import { types, resolvers } from "./graphql";
import DataStore from "./datastore.js";

const check_datastores = (datastores) => {
  let datastores_accept = true;
  return datastores_accept;
};

const create_datastores = (plugin_name) => {
  if (PenPal.LoadedPlugins[plugin_name].settings?.datastores !== undefined) {
    console.log(`[.] Creating datastores for ${plugin_name}`);
    PenPal.DataStore.CreateStores(
      PenPal.LoadedPlugins[plugin_name].name,
      PenPal.LoadedPlugins[plugin_name].settings?.datastores?.map(
        ({ name }) => name
      ) ?? []
    );
  }
};

const DataStorePlugin = {
  loadPlugin() {
    PenPal.DataStore = DataStore;

    return {
      graphql: {
        types,
        resolvers
      },
      settings: {},
      hooks: {
        settings: { datastores: check_datastores },
        postload: create_datastores
      }
    };
  }
};

export default DataStorePlugin;
