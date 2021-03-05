import { Meteor } from "meteor/meteor";
import PenPal from "meteor/penpal";

const getXablePlugins = settings_field => {
  const plugins_name_version = Object.keys(PenPal.LoadedPlugins);
  return plugins_name_version
    .filter(
      plugin_name_version =>
        PenPal.LoadedPlugins[plugin_name_version].settings?.[settings_field] !==
        undefined
    )
    .map(plugin_name_version => ({
      id: plugin_name_version
    }));
};

const getPluginXSettings = (plugin_id, settings_field) => {
  const plugin = PenPal.LoadedPlugins[plugin_id];
  if (plugin === undefined) {
    throw new Meteor.Error(404, "Plugin not found");
  }
  return plugin.settings?.[settings_field];
};

export default {
  async getPlugins(root, args, context) {
    const plugins_name_version = Object.keys(PenPal.LoadedPlugins);
    return plugins_name_version.map(plugin_name_version => ({
      id: plugin_name_version
    }));
  },

  async getConfigurablePlugins(root, args, context) {
    return getXablePlugins("configuration");
  },

  async getPluginConfigurationSettings(root, { plugin_id }, context) {
    return getPluginXSettings(plugin_id, "configuration");
  },

  async getDashboardablePlugins(root, args, context) {
    return getXablePlugins("dashboard");
  },

  async getPluginDashboardSettings(root, { plugin_id }, context) {
    return getPluginXSettings(plugin_id, "dashboard");
  }
};
