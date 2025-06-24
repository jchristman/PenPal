import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as API from "./api/index.js";

// File-level logger that can be imported by other files
export const TesterLogger = PenPal.Utils.BuildLogger("Tester");

const TesterPlugin = {
  async loadPlugin() {
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
