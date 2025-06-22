import PenPal from "#penpal/core";
import _ from "lodash";
import chalk from "chalk";
import betterLogging, { Theme } from "better-logging";
betterLogging(console, {
  color: {
    base: chalk.greenBright,
    type: {
      debug: chalk.magentaBright,
      info: chalk.magentaBright,
      log: chalk.magentaBright,
      error: chalk.red,
      warn: chalk.orange,
    },
  },
});

import startGraphQLServer from "./graphql-server.js";

Error.stackTraceLimit = Infinity;

const run = async () => {
  console.log("[.] Running PenPal Init");
  await PenPal.init();

  console.log("[.] Registering Plugins...");
  const Plugins = await import("#penpal/plugins");
  await Plugins.registerPlugins();

  // Load all plugins
  console.log("[.] Loading Plugins...");
  const { plugins_types, plugins_resolvers, plugins_buildLoaders } =
    await PenPal.loadPlugins();
  console.log("[+] Plugins loaded");

  // Startup Hooks
  console.log("[.] Executing Plugin Startup hooks...");
  await PenPal.runStartupHooks();
  console.log("[+] Startup Hooks executed");

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
