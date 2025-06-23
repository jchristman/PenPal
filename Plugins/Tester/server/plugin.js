import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as API from "./api/index.js";

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

    console.log("[Tester] Plugin loaded and API registered");
    console.log(
      "[Tester] Use PenPal.Tester.RegisterHandler(plugin_name, function_handler, args_schema) to register test handlers"
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
