import PenPal from "#penpal/core";
import _ from "lodash";

import startGraphQLServer from "./graphql-server.js";

// Initialize logger for the core PenPal server
const logger = PenPal.Utils.BuildLogger("PenPal");

// Global error handlers
process.on("uncaughtException", (error) => {
  logger.error("UNCAUGHT EXCEPTION:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("UNHANDLED REJECTION:", reason);
});

Error.stackTraceLimit = Infinity;

const run = async () => {
  logger.log("Running PenPal Init");
  await PenPal.init();

  logger.log("Registering Plugins...");
  const Plugins = await import("#penpal/plugins");
  await Plugins.registerPlugins();

  // Load all plugins
  logger.log("Loading Plugins...");
  const { plugins_types, plugins_resolvers, plugins_buildLoaders } =
    await PenPal.loadPlugins();
  logger.log("Plugins loaded");

  // Startup Hooks
  logger.log("Executing Plugin Startup hooks...");
  await PenPal.runStartupHooks();
  logger.log("Startup Hooks executed");

  // Start the graphql server
  logger.log("Starting GraphQL Server");
  await startGraphQLServer(
    plugins_types,
    plugins_resolvers,
    plugins_buildLoaders
  );

  logger.log("App is running!");
};

run();
