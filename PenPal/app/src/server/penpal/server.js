import _ from "lodash";
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { loadFiles } from "@graphql-tools/load-files";
import {
  Constants as _Constants,
  isFunction,
  check_manifest,
  check_plugin,
} from "#penpal/common";
export const Constants = _Constants;

// ----------------------------------------------------------------------------

const PenPal = {};
PenPal.Constants = Constants;
PenPal.RegisteredPlugins = {};
PenPal.LoadedPlugins = {};
PenPal.Utils = {};

// ----------------------------------------------------------------------------

PenPal.Utils.Sleep = async (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

PenPal.Utils.AsyncNOOP = async () => {
  await PenPal.Utils.Sleep(0);
};

PenPal.Utils.LoadGraphQLDirectories = async (root_dir) => {
  const typesArray = await loadFiles(root_dir, {
    recursive: true,
    extensions: ["graphql"],
  });
  return mergeTypeDefs(typesArray);
};

// ----------------------------------------------------------------------------

PenPal.Utils.isFunction = isFunction;

PenPal.registerPlugin = (manifest, plugin) => {
  if (!check_manifest(manifest) || !check_plugin(plugin)) {
    console.error(
      `[!] Failed to register plugin: ${manifest?.name}@${manifest?.version}`
    );
    return;
  }

  const {
    name,
    version,
    dependsOn,
    requiresImplementation = false,
    implements: imp = "", // Renaming happens because of the reserved keyword implements, but naming is better, I think
  } = manifest;

  const name_version = `${name}@${version}`;
  console.log(`[+] Registered plugin: ${name_version}`);

  PenPal.RegisteredPlugins[name_version] = {
    dependsOn,
    requiresImplementation,
    name,
    version,
    plugin,
    implements: imp,
  };
};

// ----------------------------------------------------------------------------

PenPal.loadPlugins = async () => {
  PenPal.LoadedPlugins = _.mapValues(PenPal.RegisteredPlugins, (plugin) => ({
    loaded: false,
    name: plugin.name,
    version: plugin.version,
  }));

  let plugins_types = null;
  let plugins_resolvers = [{ Query: {} }, { Mutation: {} }];
  let plugins_loaders = {};
  let extra_settings_checkers = {};
  let postload_hooks = [];

  const plugins_to_load = Object.keys(PenPal.RegisteredPlugins);
  while (plugins_to_load.length > 0) {
    const plugin_name = plugins_to_load.shift();
    const { requiresImplementation, dependsOn, plugin } =
      PenPal.RegisteredPlugins[plugin_name];

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

    // Check to see if there is something that implements this plugin if it requires an implementation
    if (requiresImplementation) {
      const implementation_exists = _.reduce(
        PenPal.RegisteredPlugins,
        (result, other_plugin) =>
          result || other_plugin.implements === plugin_name,
        false
      );

      if (!implementation_exists) {
        console.error(
          `[!] Failed to load ${plugin_name}. It requires an implementation, but none exists.`
        );
        delete PenPal.RegisteredPlugins[plugin_name];
        continue;
      }
    }

    // Now merge the types from this plugin into the schema
    const { graphql, settings, hooks } = await plugin.loadPlugin();

    if (hooks !== undefined) {
      const { postload, settings: settings_hooks, startup } = hooks;

      if (settings_hooks !== undefined) {
        if (typeof settings_hooks !== "object") {
          console.error(
            `[!] Failed to load ${plugin_name}. hooks.settings must be an object`
          );
          delete PenPal.RegisteredPlugins[plugin_name];
          continue;
        }

        for (let key in settings_hooks) {
          extra_settings_checkers[key] = settings_hooks[key];
        }
      }

      if (postload !== undefined) {
        postload_hooks.push(postload);
      }

      if (startup !== undefined) {
        PenPal.LoadedPlugins[plugin_name].startupHook = startup;
      }
    }

    for (let settings_property in extra_settings_checkers) {
      if (settings?.[settings_property] !== undefined) {
        if (
          !extra_settings_checkers[settings_property](
            settings[settings_property]
          )
        ) {
          console.error(
            `[!] Failed to load ${plugin_name}. ${settings_property} config is improper`
          );
          delete PenPal.RegisteredPlugins[plugin_name];
          continue;
        }
      }
    }

    if (graphql !== undefined) {
      const { types, resolvers, loaders } = graphql;
      if (types !== undefined)
        if (plugins_types === null) {
          plugins_types = types;
        } else {
          plugins_types = mergeTypeDefs([plugins_types, types]);
        }
      if (resolvers !== undefined)
        plugins_resolvers = mergeResolvers([plugins_resolvers, resolvers]);
      if (loaders !== undefined)
        plugins_loaders = _.merge(plugins_loaders, loaders);
    }

    PenPal.LoadedPlugins[plugin_name].loaded = true;
    PenPal.LoadedPlugins[plugin_name].settings = settings;

    for (let postload_hook of postload_hooks) {
      await postload_hook(plugin_name);
    }

    console.log(`[+] Loaded ${plugin_name}`);
  }

  for (let plugin_name of Object.keys(PenPal.LoadedPlugins)) {
    if (PenPal.LoadedPlugins[plugin_name].loaded === false) {
      delete PenPal.LoadedPlugins[plugin_name];
    }
  }

  return {
    plugins_types,
    plugins_resolvers,
    plugins_loaders,
  };
};

// ----------------------------------------------------------------------------

PenPal.runStartupHooks = async () => {
  for (let plugin_name in PenPal.LoadedPlugins) {
    await PenPal.LoadedPlugins[plugin_name].startupHook?.();
  }
};

// ----------------------------------------------------------------------------

export default PenPal;
