import { check, Match } from "meteor/check";

// ----------------------------------------------------------------------------

export const Regex = {};
Regex.ip_address = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const Constants = {
  Role: {
    Admin: "Role.Admin",
    User: "Role.User"
  }
};

export const isFunction = (obj) =>
  !!(obj && obj.constructor && obj.call && obj.apply);

// ----------------------------------------------------------------------------

export const check_manifest = ({ name, version, dependsOn }) => {
  let manifest_accept = true;

  const try_check = (value, type, repr_value, repr_type) => {
    try {
      check(value, type);
    } catch (e) {
      console.error(`Manifest.${repr_value} must be of type ${repr_type}`);
      manifest_accept = false;
    }
  };

  try_check(name, String, "name", "String");
  try_check(version, String, "version", "String");
  try_check(dependsOn, [String], "dependsOn", "[String]");

  return manifest_accept;
};

// ----------------------------------------------------------------------------

export const check_plugin = (plugin) => {
  let plugin_accept = true;

  const try_check = (value, type, repr_value, repr_type) => {
    try {
      check(value, type);
    } catch (e) {
      console.error(`Plugin.${repr_value} must be of type ${repr_type}`);
      plugin_accept = false;
    }
  };

  try_check(
    plugin.loadPlugin,
    Match.Where(isFunction),
    "loadPlugin",
    "Function"
  );

  return plugin_accept;
};

// ----------------------------------------------------------------------------
