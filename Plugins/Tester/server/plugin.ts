import PenPal from "#penpal/core";
import type { PenPalPlugin, PluginLoadResult } from "#penpal/common";
import { loadGraphQLFiles, resolvers } from "./graphql/index.ts";
import * as API from "./api/index.ts";

// File-level logger that can be imported by other files
export const TesterLogger = PenPal.Utils.BuildLogger("Tester");

const TesterPlugin: PenPalPlugin = {
  async loadPlugin(): Promise<PluginLoadResult> {
    // Register the Tester API on the PenPal object
    PenPal.Tester = {
      // Main API function as specified in requirements
      RegisterHandler: API.registerHandler,

      // Additional utility functions
      GetHandlers: API.getRegisteredHandlers,
      GetHandler: API.getHandler,
      InvokeHandler: API.invokeHandler,
      UnregisterHandler: API.unregisterHandler,
      ClearPluginHandlers: API.clearPluginHandlers,
    };

    TesterLogger.info("Plugin loaded and API registered");
    TesterLogger.info(
      "Use PenPal.Tester.RegisterHandler(plugin_name, function_handler, args_schema) to register test handlers"
    );

    const types = await loadGraphQLFiles();

    return {
      graphql: {
        types,
        resolvers,
      },
    };
  },
};

export default TesterPlugin;
