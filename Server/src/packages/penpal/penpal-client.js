import _ from "lodash";
import { check_manifest, check_plugin, isFunction } from "./common.js";

// ----------------------------------------------------------------------------

const PenPal = {};

// ----------------------------------------------------------------------------

export const Components = {};
PenPal.Components = Components;

// ----------------------------------------------------------------------------

export const registerComponent = (name, component) => {
  Components[name] = component;
};
PenPal.registerComponent = registerComponent;

// ----------------------------------------------------------------------------

export const Hooks = {};
PenPal.Hooks = Hooks;

// ----------------------------------------------------------------------------

export const registerHook = (name, hook) => {
  Hooks[name] = hook;
};
PenPal.registerHook = registerHook;

// ----------------------------------------------------------------------------

export const Routes = [];
PenPal.Routes = Routes;

// ----------------------------------------------------------------------------

export const registerRoute = (options, index = -1) => {
  if (index === -1) {
    Routes.push(options);
  } else {
    Routes.splice(index, 0, options);
  }
};
PenPal.registerRoute = registerRoute;

// ----------------------------------------------------------------------------

export const getRoute = (route_name) =>
  _.find(Routes, (route) => route.name === route_name);
PenPal.getRoute = getRoute;

// ----------------------------------------------------------------------------

import { Regex as _Regex } from "./common.js";
export const Regex = _Regex;
PenPal.Regex = Regex;

// ----------------------------------------------------------------------------

import * as _GraphQLUtils from "./graphql-utils.js";
export const GraphQLUtils = _GraphQLUtils;
PenPal.GraphQL = { Utils: GraphQLUtils };

// ----------------------------------------------------------------------------

PenPal.RegisteredPlugins = {};
PenPal.LoadedPlugins = {};
PenPal.registerPlugin = (manifest, plugin) => {
  if (!check_manifest(manifest) || !check_plugin(plugin)) {
    console.error(
      `[!] Failed to register plugin: ${manifest?.name}@${manifest?.version}`
    );
    return;
  }

  const { name, version, dependsOn } = manifest;

  const name_version = `${name}@${version}`;
  console.log(`[+] Registered plugin: ${name_version}`);

  PenPal.RegisteredPlugins[name_version] = {
    name,
    version,
    dependsOn,
    plugin
  };
};

PenPal.loadPlugins = async () => {
  PenPal.LoadedPlugins = _.mapValues(PenPal.RegisteredPlugins, (plugin) => ({
    loaded: false,
    name: plugin.name,
    version: plugin.version
  }));

  const plugins_to_load = Object.keys(PenPal.RegisteredPlugins);
  while (plugins_to_load.length > 0) {
    const plugin_name = plugins_to_load.shift();
    const { dependsOn, plugin } = PenPal.RegisteredPlugins[plugin_name];

    // Ensure that all prerequisites are available.  If not, it's impossible to load
    const all_prereqs_available = _.reduce(
      dependsOn,
      (result, prereq) =>
        result && PenPal.RegisteredPlugins[prereq] !== undefined,
      true
    );
    if (!all_prereqs_available) {
      console.error(
        `[!] Failed to load ${plugin_name}. Not all dependencies met.`
      );
      delete PenPal.RegisteredPlugins[plugin_name];
      continue;
    }

    // Check to see if all prerequisites loaded. If not, to the back of the queue.
    const all_prereqs_loaded = _.reduce(
      dependsOn,
      (result, prereq) => result && PenPal.LoadedPlugins[prereq].loaded,
      true
    );
    if (!all_prereqs_loaded) {
      plugins_to_load.push(plugin_name);
      continue;
    }

    // Now merge the types from this plugin into the schema
    const { registerRoutes } = await plugin.loadPlugin();
    if (registerRoutes !== undefined) {
      if (!isFunction(registerRoutes)) {
        console.error(`Plugin.registerRoute must be a function`);
        delete PenPal.RegisteredPlugins[plugin_name];
        continue;
      }

      console.log(`[.] Registering routes for ${plugin_name}`);
      registerRoutes();
    }

    PenPal.LoadedPlugins[plugin_name].loaded = true;

    console.log(`[+] Loaded ${plugin_name}`);
  }

  for (plugin_name of Object.keys(PenPal.LoadedPlugins)) {
    if (PenPal.LoadedPlugins[plugin_name].loaded === false) {
      delete PenPal.LoadedPlugins[plugin_name];
    }
  }
};

// ----------------------------------------------------------------------------

const registeredMocks = {};
export const StorybookMocks = [];
export const registerStorybookMocks = (plugin_name, mocks) => {
  if (registeredMocks[plugin_name]) {
    return;
  }

  registeredMocks[plugin_name] = true;
  StorybookMocks.push(...mocks);
};

// ----------------------------------------------------------------------------

export default PenPal;
