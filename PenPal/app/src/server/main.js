import PenPal from "#penpal/core";
import _ from "lodash";

import startGraphQLServer from "./graphql-server.js";

const run = async () => {
  console.log("[.] Registering Plugins...");
  const Plugins = await import("#penpal/plugins");
  await Plugins.registerPlugins();

  // Load all plugins
  console.log("[.] Loading Plugins...");
  const { plugins_types, plugins_resolvers, plugins_buildLoaders } =
    await PenPal.loadPlugins();

  // Startup Hooks
  // FIXME
  //PenPal.runStartupHooks();

  // Start the graphql server
  console.log("[.] Starting GraphQL Server");
  await startGraphQLServer(
    plugins_types,
    plugins_resolvers,
    plugins_buildLoaders
  );

  console.log("[+] App is running!");
};

run();
