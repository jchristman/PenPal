import PenPal from "#penpal/core";

const getXablePlugins = (settings_field: string): any[] => {
  const plugins_name_version = Object.keys(PenPal.LoadedPlugins);
  return plugins_name_version
    .filter(
      (plugin_name_version: string) =>
        PenPal.LoadedPlugins[plugin_name_version].settings?.[settings_field] !==
        undefined
    )
    .map((plugin_name_version: string) => ({
      id: plugin_name_version,
    }));
};

const getPluginXSettings = (plugin_id: string, settings_field: string): any => {
  const plugin = PenPal.LoadedPlugins[plugin_id];
  if (plugin === undefined) {
    throw new Error("[404] Plugin not found");
  }
  return plugin.settings?.[settings_field];
};

export default {
  async getPlugins(_root: any, _args: any, _context: any): Promise<any[]> {
    const plugins_name_version = Object.keys(PenPal.LoadedPlugins);
    return plugins_name_version.map((plugin_name_version: string) => ({
      id: plugin_name_version,
    }));
  },

  async getConfigurablePlugins(_root: any, _args: any, _context: any): Promise<any[]> {
    return getXablePlugins("configuration");
  },

  async getPluginConfigurationSettings(_root: any, { plugin_id }: { plugin_id: string }, _context: any): Promise<any> {
    return getPluginXSettings(plugin_id, "configuration");
  },

  async getDashboardablePlugins(_root: any, _args: any, _context: any): Promise<any[]> {
    return getXablePlugins("dashboard");
  },

  async getPluginDashboardSettings(_root: any, { plugin_id }: { plugin_id: string }, _context: any): Promise<any> {
    return getPluginXSettings(plugin_id, "dashboard");
  },
};
