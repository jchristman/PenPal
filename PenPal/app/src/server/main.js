import PenPal from "./penpal/server.js";
import _ from "lodash";

import startGraphQLServer from "./graphql-server.js";

// Load all plugins (after registrations are complete)
//const { plugins_types, plugins_resolvers, plugins_buildLoaders } =
//   await PenPal.loadPlugins();

// Startup Hooks
// FIXME
//PenPal.runStartupHooks();

// Start the graphql server
startGraphQLServer(plugins_types, plugins_resolvers, plugins_buildLoaders);

console.log("[+] App is running!");
