import { check as _check } from "./check.js";
import type { PluginManifest, PluginModule } from "../types/plugins";

// Regular expressions
export const Regex: Record<string, RegExp> = {};
Regex.ip_address =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Constants
export const Constants = {
  Role: {
    Admin: "Role.Admin" as const,
    User: "Role.User" as const,
  },
} as const;

// Type-safe function check
export const isFunction = (obj: any): obj is Function =>
  !!(obj && obj.constructor && obj.call && obj.apply);

// Type checking utility
export const check = (value: any, type: any, repr_value: string, repr_type: string): boolean => {
  let pass = _check(value, type);
  if (!pass) {
    console.error(`${repr_value} must be of type ${repr_type}`);
  }
  return pass;
};

// Plugin manifest validation
export const check_manifest = (manifest: Partial<PluginManifest>): boolean => {
  let manifest_accept = true;

  // Type checking is disabled for now but can be enabled when needed
  // manifest_accept &&= check(manifest.name, String, "Manifest.name", "String");
  // manifest_accept &&= check(manifest.version, String, "Manifest.version", "String");
  // manifest_accept &&= check(
  //   manifest.dependsOn,
  //   Array,
  //   "Manifest.dependsOn",
  //   "Array"
  // );

  return manifest_accept;
};

// Plugin validation
export const check_plugin = (plugin: Partial<PluginModule>): boolean => {
  let plugin_accept = true;

  // Type checking is disabled for now but can be enabled when needed
  // plugin_accept &&= check(
  //   plugin.loadPlugin,
  //   Function,
  //   "Plugin.loadPlugin",
  //   "Function"
  // );

  return plugin_accept;
};
