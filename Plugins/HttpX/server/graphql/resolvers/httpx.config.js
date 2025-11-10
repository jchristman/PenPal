import PenPal from "#penpal/core";
import { settings as HttpXSettings } from "../../plugin.js";

const DEFAULT_CONFIG = { ui: { STATUS_SLEEP: 1000, enabled: true } };

const getStoredConfig = async () => {
  const existing = await PenPal.DataStore.fetch("HttpX", "Configuration", {});
  if (existing.length === 0) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...existing[0] };
};

const saveConfig = async (config) => {
  const existing = await PenPal.DataStore.fetch("HttpX", "Configuration", {});
  if (existing.length > 0) {
    await PenPal.DataStore.updateOne(
      "HttpX",
      "Configuration",
      { id: `${existing[0].id}` },
      { $set: config }
    );
    return config;
  }
  const inserted = await PenPal.DataStore.insertMany("HttpX", "Configuration", [
    config,
  ]);
  return inserted?.[0] ?? config;
};

export default {
  queries: {
    async getHttpXConfiguration() {
      const cfg = await getStoredConfig();
      return {
        ...cfg,
        _ui: {
          sections: [{ path: "ui", label: "General" }],
          conditional: [
            {
              path: "ui",
              controller: "enabled",
              showWhenTrue: ["STATUS_SLEEP"],
              showWhenFalse: [],
            },
          ],
        },
      };
    },
  },
  mutations: {
    async setHttpXConfiguration(parent, { configuration }) {
      const current = await getStoredConfig();
      const next = { ...current };
      if (configuration?.ui) {
        next.ui.STATUS_SLEEP = Number(
          configuration.ui.STATUS_SLEEP ?? next.ui.STATUS_SLEEP
        );
        if (configuration.ui.enabled !== undefined) {
          next.ui.enabled = !!configuration.ui.enabled;
        }
      }
      const saved = await saveConfig(next);
      if (saved?.ui?.STATUS_SLEEP !== undefined) {
        HttpXSettings.STATUS_SLEEP = saved.ui.STATUS_SLEEP;
      }
      return {
        ...saved,
        _ui: {
          sections: [{ path: "ui", label: "General" }],
          conditional: [
            {
              path: "ui",
              controller: "enabled",
              showWhenTrue: ["STATUS_SLEEP"],
              showWhenFalse: [],
            },
          ],
        },
      };
    },
  },
};
