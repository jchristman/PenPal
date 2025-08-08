import PenPal from "#penpal/core";
import { settings as PingSettings } from "../../plugin.js";

const DEFAULT_CONFIG = {
  ui: { STATUS_SLEEP: 900 },
};

const getStoredConfig = async () => {
  const existing = await PenPal.DataStore.fetch("Ping", "Configuration", {});
  if (existing.length === 0) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...existing[0] };
};

const saveConfig = async (config) => {
  const existing = await PenPal.DataStore.fetch("Ping", "Configuration", {});
  if (existing.length > 0) {
    await PenPal.DataStore.updateOne(
      "Ping",
      "Configuration",
      { id: `${existing[0].id}` },
      { $set: config }
    );
    return config;
  }
  const inserted = await PenPal.DataStore.insertMany("Ping", "Configuration", [
    config,
  ]);
  return inserted?.[0] ?? config;
};

export default {
  queries: {
    async getPingConfiguration() {
      const cfg = await getStoredConfig();
      return { ...cfg, _ui: { sections: [{ path: "ui", label: "General" }] } };
    },
  },
  mutations: {
    async setPingConfiguration(parent, { configuration }) {
      const current = await getStoredConfig();
      const next = { ...current };
      if (configuration?.ui) {
        next.ui.STATUS_SLEEP = Number(
          configuration.ui.STATUS_SLEEP ?? next.ui.STATUS_SLEEP
        );
      }
      const saved = await saveConfig(next);

      // Update in-memory settings
      if (saved?.ui?.STATUS_SLEEP !== undefined) {
        PingSettings.STATUS_SLEEP = saved.ui.STATUS_SLEEP;
      }

      return {
        ...saved,
        _ui: { sections: [{ path: "ui", label: "General" }] },
      };
    },
  },
};
