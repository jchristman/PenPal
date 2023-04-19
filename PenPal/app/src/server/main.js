import PenPal from "@penpal/core";
import Plugins from "@penpal/plugins";
import _ from "lodash";

import startGraphQLServer from "./graphql-server.js";

const run = async () => {
  await Plugins.registerPlugins();

  // Load all plugins (after registrations are complete)
  //const { plugins_types, plugins_resolvers, plugins_buildLoaders } =
  //   await PenPal.loadPlugins();
  const plugins_types = [],
    plugins_resolvers = [],
    plugins_buildLoaders = () => {};

  // Startup Hooks
  // FIXME
  //PenPal.runStartupHooks();

  // Start the graphql server
  await startGraphQLServer(
    plugins_types,
    plugins_resolvers,
    plugins_buildLoaders
  );

  console.log("[+] App is running!");
};

run();
