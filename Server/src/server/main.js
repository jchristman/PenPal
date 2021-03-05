import { Meteor } from "meteor/meteor";
import PenPal from "meteor/penpal";
import _ from "lodash";

import setAppSettings from "./settings.js";
import startGraphQLServer from "./graphql-server.js";

// Import the migrations to make sure they are available
import "./migrations";

Meteor.startup(async function() {
  // This is here for the docker build process
  if (process.env.EXIT !== undefined) {
    console.log("Environment variable set. Exiting now...");
    process.exit(0);
  }

  // Execute any migrations to ensure all database modifications are made as necessary
  Migrations.migrateTo("latest");

  // Additional settings
  setAppSettings();

  // Load all plugins (after registrations are complete)
  const {
    plugins_types,
    plugins_resolvers,
    plugins_buildLoaders
  } = await PenPal.loadPlugins();

  // Startup Hooks
  PenPal.runStartupHooks();

  // Start the graphql server
  startGraphQLServer(plugins_types, plugins_resolvers, plugins_buildLoaders);

  console.log("[+] App is running!");
});
