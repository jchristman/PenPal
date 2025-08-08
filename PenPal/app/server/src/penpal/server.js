import _ from "lodash";
import path from "path";
import fs from "fs";
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

PenPal.Constants.TMP_DIR = "/tmp/penpal";

// ----------------------------------------------------------------------------

PenPal.Utils.Epoch = () => Math.floor(new Date().getTime() / 1000);

PenPal.Utils.Sleep = async (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

PenPal.Utils.AsyncNOOP = async () => {
  await PenPal.Utils.Sleep(0);
};

PenPal.Utils.AwaitTimeout = async (awaitFunction, timeout) => {
  const result = await Promise.race([
    awaitFunction(),
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("Timeout occurred")), timeout); // Timeout after 5 seconds
    }),
  ]);

  return result;
};

PenPal.Utils.LoadGraphQLDirectories = async (root_dir) => {
  const typesArray = await loadFiles(root_dir, {
    recursive: true,
    extensions: ["graphql"],
  });
  return mergeTypeDefs(typesArray);
};

PenPal.Utils.MkdirP = (directory) => {
  const absolute = directory[0] === path.sep;
  const directories = directory.split(path.sep);
  let currentDirectory = absolute ? path.sep : "";

  for (const dir of directories) {
    currentDirectory = path.join(currentDirectory, dir);

    if (!fs.existsSync(currentDirectory)) {
      fs.mkdirSync(currentDirectory);
    }
  }
};

PenPal.Utils.RunAfterImport = (fn) => {
  setTimeout(fn, 0);
};

PenPal.Utils.isFunction = isFunction;

PenPal.Utils.BatchFunction = (handler, timeoutMs) => {
  let batchedArgs = [];
  let timeoutId = null;

  return (...args) => {
    // Add the arguments to the batch
    batchedArgs.push(args);

    // Clear existing timeout if one is already set
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout to process the batch
    timeoutId = setTimeout(() => {
      const argsToProcess = [...batchedArgs];
      batchedArgs = [];
      timeoutId = null;

      // Call the handler with the array of batched arguments
      handler(argsToProcess);
    }, timeoutMs);
  };
};

// Logger utility for plugins
PenPal.Utils.Logger = (() => {
  // ANSI color codes for different plugins
  const colors = [
    "\x1b[32m", // Green
    "\x1b[33m", // Yellow
    "\x1b[34m", // Blue
    "\x1b[35m", // Magenta
    "\x1b[36m", // Cyan
    "\x1b[92m", // Bright Green
    "\x1b[93m", // Bright Yellow
    "\x1b[94m", // Bright Blue
    "\x1b[95m", // Bright Magenta
    "\x1b[96m", // Bright Cyan
    "\x1b[37m", // White
    "\x1b[90m", // Bright Black (Gray)
    "\x1b[97m", // Bright White
    "\x1b[38;5;208m", // Orange
    "\x1b[38;5;129m", // Purple
    "\x1b[38;5;51m", // Light Blue
    "\x1b[38;5;46m", // Lime Green
    "\x1b[38;5;226m", // Bright Yellow-Green
  ];

  const reset = "\x1b[0m";
  const bold = "\x1b[1m";
  const dim = "\x1b[2m";

  // Color assignment storage
  const pluginColors = new Map();
  let colorIndex = 0;

  // Simple hash function for consistent color assignment
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  // Get or assign color for a plugin
  const getPluginColor = (pluginName) => {
    if (!pluginColors.has(pluginName)) {
      // Use hash for consistent colors, fallback to rotation for new plugins
      const colorIdx = hashString(pluginName) % colors.length;
      pluginColors.set(pluginName, colors[colorIdx]);
    }
    return pluginColors.get(pluginName);
  };

  // Format timestamp like the current console format
  const formatTimestamp = () => {
    return new Date().toISOString();
  };

  // Create formatted message prefix
  const formatPrefix = (pluginName, level, color) => {
    const timestamp = formatTimestamp();
    const levelColors = {
      log: "",
      warn: "\x1b[33m", // Yellow for warnings
      error: "\x1b[31m", // Red for errors
    };

    const levelColor = levelColors[level] || "";
    const pluginPrefix = `${color}[${pluginName}]${reset}`;

    return `${timestamp} ${pluginPrefix}${levelColor}`;
  };

  return {
    BuildLogger: (pluginName) => {
      const color = getPluginColor(pluginName);

      return {
        log: (...args) => {
          const prefix = formatPrefix(pluginName, "log", color);
          console.log(prefix, ...args, reset);
        },

        warn: (...args) => {
          const prefix = formatPrefix(pluginName, "warn", color);
          console.warn(prefix, ...args, reset);
        },

        error: (...args) => {
          const prefix = formatPrefix(pluginName, "error", color);
          console.error(prefix, ...args, reset);
        },

        info: (...args) => {
          const prefix = formatPrefix(pluginName, "log", color);
          console.info(prefix, ...args, reset);
        },

        debug: (...args) => {
          const prefix = formatPrefix(pluginName, "log", color);
          console.debug(prefix, `${dim}`, ...args, `${reset}`);
        },
      };
    },
  };
})();

// Expose BuildLogger directly on PenPal.Utils for convenience
PenPal.Utils.BuildLogger = PenPal.Utils.Logger.BuildLogger;
const logger = PenPal.Utils.BuildLogger("PenPal");

// ----------------------------------------------------------------------------

PenPal.init = async () => {
  PenPal.Utils.MkdirP(PenPal.Constants.TMP_DIR);
};

// ----------------------------------------------------------------------------

PenPal.registerPlugin = (manifest, plugin) => {
  if (!check_manifest(manifest) || !check_plugin(plugin)) {
    logger.error(
      `Failed to register plugin: ${manifest?.name}@${manifest?.version}`
    );
    return;
  }

  const {
    name,
    load,
    version,
    dependsOn,
    requiresImplementation = false,
    implements: imp = "", // Renaming happens because of the reserved keyword implements, but naming is better, I think
  } = manifest;

  const name_version = `${name}@${version}`;
  if (load === false) {
    logger.warn(
      `Manifest for ${name_version} has "load" set to false. Skipping.`
    );
    return;
  }

  logger.log(`Registered plugin: ${name_version}`);

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
      logger.error(`Failed to load ${plugin_name}. Not all dependencies met.`);
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
        logger.error(
          `Failed to load ${plugin_name}. It requires an implementation, but none exists.`
        );
        delete PenPal.RegisteredPlugins[plugin_name];
        continue;
      }
    }

    // Now merge the types from this plugin into the schema
    const { graphql, settings, hooks, jobs } = await plugin.loadPlugin();

    if (hooks !== undefined) {
      const { postload, settings: settings_hooks, startup } = hooks;

      if (settings_hooks !== undefined) {
        if (typeof settings_hooks !== "object") {
          logger.error(
            `Failed to load ${plugin_name}. hooks.settings must be an object`
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
          logger.error(
            `Failed to load ${plugin_name}. ${settings_property} config is improper`
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
    // Only store jobs if the plugin provides them (legacy support)
    if (jobs !== undefined) {
      PenPal.LoadedPlugins[plugin_name].jobs = jobs;
    }

    for (let postload_hook of postload_hooks) {
      await postload_hook(plugin_name);
    }

    logger.log(`Loaded ${plugin_name}`);

    // If this plugin requires implementation, immediately prioritize loading all its implementations
    if (requiresImplementation) {
      const implementations = [];

      // Find all implementations for this plugin
      Object.keys(PenPal.RegisteredPlugins).forEach((other_plugin_name) => {
        const other_plugin = PenPal.RegisteredPlugins[other_plugin_name];
        if (other_plugin.implements === plugin_name) {
          implementations.push(other_plugin_name);
        }
      });

      if (implementations.length > 0) {
        // Find all dependencies needed by the implementations (recursively)
        const getDependenciesRecursively = (
          pluginName,
          visited = new Set()
        ) => {
          if (visited.has(pluginName)) return [];
          visited.add(pluginName);

          const plugin = PenPal.RegisteredPlugins[pluginName];
          if (!plugin) return [];

          let allDeps = [];
          for (const dep of plugin.dependsOn) {
            if (!PenPal.LoadedPlugins[dep].loaded) {
              allDeps.push(dep);
              allDeps.push(...getDependenciesRecursively(dep, visited));
            }
          }
          return allDeps;
        };

        const allRequiredPlugins = new Set();

        // Add implementations and their dependencies
        implementations.forEach((impl) => {
          allRequiredPlugins.add(impl);
          getDependenciesRecursively(impl).forEach((dep) =>
            allRequiredPlugins.add(dep)
          );
        });

        // Remove all required plugins from the current queue
        const remaining_plugins = [];
        while (plugins_to_load.length > 0) {
          const next_plugin = plugins_to_load.shift();
          if (!allRequiredPlugins.has(next_plugin)) {
            remaining_plugins.push(next_plugin);
          }
        }

        // Sort required plugins by dependency order (dependencies first)
        const sortedRequired = Array.from(allRequiredPlugins).sort((a, b) => {
          const aPlugin = PenPal.RegisteredPlugins[a];
          const bPlugin = PenPal.RegisteredPlugins[b];

          // If a depends on b, b should come first
          if (aPlugin.dependsOn.includes(b)) return 1;
          if (bPlugin.dependsOn.includes(a)) return -1;

          // If a implements something and b doesn't, b should come first (implementations last)
          if (aPlugin.implements && !bPlugin.implements) return 1;
          if (!aPlugin.implements && bPlugin.implements) return -1;

          return 0;
        });

        // Add sorted required plugins to the front of the queue, then the remaining plugins
        plugins_to_load.unshift(...sortedRequired, ...remaining_plugins);

        logger.log(
          `Prioritized implementations for ${plugin_name}: ${implementations.join(
            ", "
          )}`
        );
        logger.log(
          `Also prioritized their dependencies: ${Array.from(allRequiredPlugins)
            .filter((p) => !implementations.includes(p))
            .join(", ")}`
        );
      }
    }
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
