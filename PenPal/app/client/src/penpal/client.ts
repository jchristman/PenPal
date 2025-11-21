import { isFunction, Regex as _Regex } from "@penpal/common";
import type {
  PenPalComponent,
  PenPalHook,
  PenPalRoute,
  PenPalBadge,
  PenPalProjectScopeButton,
  PenPalPluginManifest,
  PenPalPlugin,
  PenPalRegisteredPlugin,
  PenPalLoadedPlugin,
} from "../types.js";

// ----------------------------------------------------------------------------

// Initialize PenPal global object
if ((globalThis as any).PenPal === undefined) {
  (globalThis as any).PenPal = {};
}

const PenPal = (globalThis as any).PenPal;

// ----------------------------------------------------------------------------

export const Components: Record<string, any> = {};
PenPal.Components = Components;

// ----------------------------------------------------------------------------

export const registerComponent = (
  name: string,
  component: React.ComponentType<any>
): void => {
  Components[name] = component;
};
PenPal.registerComponent = registerComponent;

// ----------------------------------------------------------------------------

export const Hooks: Record<string, any> = {};
PenPal.Hooks = Hooks;

// ----------------------------------------------------------------------------

export const registerHook = (name: string, hook: (...args: any[]) => any): void => {
  Hooks[name] = hook;
};
PenPal.registerHook = registerHook;

// ----------------------------------------------------------------------------

export const Types: Record<string, any> = {};
PenPal.Types = Types;

// ----------------------------------------------------------------------------

export const Routes: PenPalRoute[] = [];
PenPal.Routes = Routes;

// ----------------------------------------------------------------------------

export const registerRoute = (
  options: PenPalRoute,
  index: number = -1
): void => {
  if (index === -1) {
    Routes.push(options);
  } else {
    Routes.splice(index, 0, options);
  }
};
PenPal.registerRoute = registerRoute;

// ----------------------------------------------------------------------------

export const Badges: PenPalBadge[] = [];
PenPal.Badges = Badges;

// ----------------------------------------------------------------------------

export const registerBadge = (badge: PenPalBadge | any): void => {
  const badgeObject = badge.component ? badge : { component: badge, order: 0 };
  Badges.push(badgeObject);
  Badges.sort((a, b) => (a.order || 0) - (b.order || 0));
};
PenPal.registerBadge = registerBadge;

// ----------------------------------------------------------------------------

export const ProjectScopeButtons: PenPalProjectScopeButton[] = [];
PenPal.ProjectScopeButtons = ProjectScopeButtons;

// ----------------------------------------------------------------------------

export const registerProjectScopeButton = (
  buttonConfig: PenPalProjectScopeButton
): void => {
  // Validate the button configuration
  if (!buttonConfig.name || !buttonConfig.component) {
    console.error(
      "Project scope button registration failed: missing name or component"
    );
    return;
  }

  ProjectScopeButtons.push({
    ...buttonConfig,
    order: buttonConfig.order || 0,
  });

  // Sort by order
  ProjectScopeButtons.sort((a, b) => (a.order || 0) - (b.order || 0));
};
PenPal.registerProjectScopeButton = registerProjectScopeButton;

// ----------------------------------------------------------------------------

export const getRoute = (route_name: string): PenPalRoute | undefined =>
  Routes.find((route: PenPalRoute) => route.name === route_name);
PenPal.getRoute = getRoute;

// ----------------------------------------------------------------------------

export const Utils: Record<string, any> = {};
PenPal.Utils = Utils;

// ----------------------------------------------------------------------------

export const registerUtil = (name: string, util: any): void => {
  Utils[name] = util;
};
PenPal.registerUtil = registerUtil;

// ----------------------------------------------------------------------------

export const Regex = _Regex;
PenPal.Regex = Regex;

// ----------------------------------------------------------------------------

import * as _GraphQLUtils from "./graphql-utils.js";
export const GraphQLUtils = _GraphQLUtils;
PenPal.GraphQL = { Utils: GraphQLUtils };

// ----------------------------------------------------------------------------

PenPal.RegisteredPlugins = {} as Record<string, PenPalRegisteredPlugin>;
PenPal.LoadedPlugins = {} as Record<string, PenPalLoadedPlugin>;
PenPal.registerPlugin = (
  manifest: PenPalPluginManifest,
  plugin: PenPalPlugin
): void => {
  const name = manifest?.name || "unknown";
  const version = manifest?.version || "unknown";
  const dependsOn = manifest?.dependsOn || [];

  const name_version = `${name || "unknown"}@${version || "unknown"}`;
  console.log(`Registered plugin: ${name_version}`);

  PenPal.RegisteredPlugins[name_version] = {
    name,
    version,
    dependsOn,
    plugin,
  };
};

PenPal.loadPlugins = async (): Promise<void> => {
  PenPal.LoadedPlugins = {};
  for (const plugin of Object.values(
    PenPal.RegisteredPlugins
  ) as PenPalRegisteredPlugin[]) {
    PenPal.LoadedPlugins[`${plugin.name}@${plugin.version}`] = {
      loaded: false,
      name: plugin.name,
      version: plugin.version,
    };
  }

  const plugins_to_load = Object.keys(PenPal.RegisteredPlugins);
  while (plugins_to_load.length > 0) {
    const plugin_name = plugins_to_load.shift()!;
    const pluginData = PenPal.RegisteredPlugins[plugin_name];
    if (!pluginData) continue;
    const { dependsOn, plugin } = pluginData;

    // Ensure that all prerequisites are available.  If not, it's impossible to load
    const all_prereqs_available = dependsOn.every(
      (prereq: string) => PenPal.RegisteredPlugins[prereq] !== undefined
    );

    if (!all_prereqs_available) {
      console.error(`Failed to load ${plugin_name}. Not all dependencies met.`);
      delete PenPal.RegisteredPlugins[plugin_name];
      continue;
    }

    // Check to see if all prerequisites loaded. If not, to the back of the queue.
    const all_prereqs_loaded = dependsOn.every(
      (prereq: string) => PenPal.LoadedPlugins[prereq]?.loaded
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

      console.log(`Registering routes for ${plugin_name}`);
      registerRoutes();
    }

    PenPal.LoadedPlugins[plugin_name].loaded = true;

    console.log(`Loaded ${plugin_name}`);
  }

  for (let plugin_name of Object.keys(PenPal.LoadedPlugins)) {
    if (PenPal.LoadedPlugins[plugin_name].loaded === false) {
      delete PenPal.LoadedPlugins[plugin_name];
    }
  }
};

// ----------------------------------------------------------------------------

export default PenPal;
