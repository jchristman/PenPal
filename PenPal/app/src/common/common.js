import { check as _check } from "./check.js";

// ----------------------------------------------------------------------------

export const Regex = {};
Regex.ip_address =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const Constants = {
  Role: {
    Admin: "Role.Admin",
    User: "Role.User",
  },
};

export const isFunction = (obj) =>
  !!(obj && obj.constructor && obj.call && obj.apply);

// ----------------------------------------------------------------------------

export const check = (value, type, repr_value, repr_type) => {
  let pass = _check(value, type);
  if (!pass) {
    console.error(`${repr_value} must be of type ${repr_type}`);
  }
  return pass;
};

// ----------------------------------------------------------------------------

export const check_manifest = ({ name, version, dependsOn }) => {
  let manifest_accept = true;

  manifest_accept &= check(name, String, "Manifest.name", "String");
  manifest_accept &= check(version, String, "Manifest.version", "String");
  manifest_accept &= check(
    dependsOn,
    [String],
    "Manifest.dependsOn",
    "[String]"
  );

  return manifest_accept;
};

// ----------------------------------------------------------------------------

export const check_plugin = (plugin) => {
  let plugin_accept = true;

  plugin_accept &= check(
    plugin.loadPlugin,
    Function,
    "Plugin.loadPlugin",
    "Function"
  );

  return plugin_accept;
};

// ----------------------------------------------------------------------------
