import PenPal from "#penpal/core";

import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import FileStore from "./filestore.js";

// File-level logger that can be imported by other files
export const FileStoreLogger = PenPal.Utils.BuildLogger("FileStore");

const check_filestores = (filestores) => {
  let filestores_accept = true;
  return filestores_accept;
};

const create_filestores = (plugin_name) => {
  if (PenPal.LoadedPlugins[plugin_name].settings?.filestores !== undefined) {
    FileStoreLogger.info(`Creating filestores for ${plugin_name}`);
    FileStore.CreateBuckets(
      PenPal.LoadedPlugins[plugin_name].name,
      PenPal.LoadedPlugins[plugin_name].settings?.filestores?.map(
        ({ name }) => name
      ) ?? []
    );
  }
};

const FileStorePlugin = {
  async loadPlugin() {
    PenPal.FileStore = FileStore;
    const types = await loadGraphQLFiles();

    return {
      graphql: {
        types,
        resolvers,
      },
      settings: {},
      hooks: {
        settings: { filestores: check_filestores },
        postload: create_filestores,
      },
    };
  },
};

export default FileStorePlugin;
