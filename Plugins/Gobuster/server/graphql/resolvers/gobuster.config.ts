import PenPal from "#penpal/core";
import { settings as GoBSettings } from "../../plugin.js";

const DEFAULT_CONFIG = { ui: { STATUS_SLEEP: 900 } };

const getStoredConfig = async () => {
  const existing = await PenPal.DataStore.fetch(
    "Gobuster",
    "Configuration",
    {}
  );
  if (existing.length === 0) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...existing[0] };
};

const saveConfig = async (config) => {
  const existing = await PenPal.DataStore.fetch(
    "Gobuster",
    "Configuration",
    {}
  );
  if (existing.length > 0) {
    await PenPal.DataStore.updateOne(
      "Gobuster",
      "Configuration",
      { id: `${existing[0].id}` },
      { $set: config }
    );
    return config;
  }
  const inserted = await PenPal.DataStore.insertMany(
    "Gobuster",
    "Configuration",
    [config]
  );
  return inserted?.[0] ?? config;
};

export default {
  queries: {
    async getGobusterConfiguration() {
      const cfg = await getStoredConfig();
      return { ...cfg, _ui: { sections: [{ path: "ui", label: "General" }] } };
    },
  },
  mutations: {
    async setGobusterConfiguration(parent, { configuration }) {
      const current = await getStoredConfig();
      const next = { ...current };
      if (configuration?.ui) {
        next.ui.STATUS_SLEEP = Number(
          configuration.ui.STATUS_SLEEP ?? next.ui.STATUS_SLEEP
        );
      }
      const saved = await saveConfig(next);
      if (saved?.ui?.STATUS_SLEEP !== undefined) {
        GoBSettings.STATUS_SLEEP = saved.ui.STATUS_SLEEP;
      }
      return {
        ...saved,
        _ui: { sections: [{ path: "ui", label: "General" }] },
      };
    },
  },
};
