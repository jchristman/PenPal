import PenPal from "#penpal/core";
import type { PenPalPlugin, PluginLoadResult } from "#penpal/common";

import { loadGraphQLFiles, resolvers } from "./graphql/index.ts";
import FileStore from "./filestore.ts";

// File-level logger that can be imported by other files
export const FileStoreLogger = PenPal.Utils.BuildLogger("FileStore");

const check_filestores = (filestores: any[]): boolean => {
  let filestores_accept = true;
  return filestores_accept;
};

const create_filestores = (plugin_name: string): void => {
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

const FileStorePlugin: PenPalPlugin = {
  async loadPlugin(): Promise<PluginLoadResult> {
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
