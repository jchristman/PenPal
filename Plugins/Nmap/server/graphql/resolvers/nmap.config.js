import PenPal from "#penpal/core";
import { settings as NmapSettings } from "../../plugin.js";

// Utility to normalize comma-separated strings to array, trimming blanks
const parsePorts = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
};

const DEFAULT_CONFIG = {
  ui: {
    STATUS_SLEEP: 900,
  },
  scan: {
    fast: {
      use_top_ports: true,
      top_ports: 1000,
      tcp_ports: [],
      udp_ports: [],
      fast_scan: true,
    },
    detailed: {
      use_top_ports: false,
      top_ports: null,
      tcp_ports: ["1-65535"],
      udp_ports: [53, 111, 135, "137-139", "161-162"],
    },
  },
};

const getStoredConfig = async () => {
  const existing = await PenPal.DataStore.fetch("Nmap", "Configuration", {});
  if (existing.length === 0) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...existing[0] };
};

const saveConfig = async (config) => {
  const existing = await PenPal.DataStore.fetch("Nmap", "Configuration", {});
  if (existing.length > 0) {
    await PenPal.DataStore.updateOne(
      "Nmap",
      "Configuration",
      { id: `${existing[0].id}` },
      { $set: config }
    );
    return config;
  }
  const inserted = await PenPal.DataStore.insertMany("Nmap", "Configuration", [
    config,
  ]);
  return inserted?.[0] ?? config;
};

export default {
  queries: {
    async getNmapConfiguration() {
      const cfg = await getStoredConfig();
      const uiMeta = {
        sections: [
          { path: "ui", label: "General" },
          { path: "scan.fast", label: "Fast Scan" },
          { path: "scan.detailed", label: "Detailed Scan" },
        ],
        mutuallyExclusive: [
          {
            path: "scan.fast",
            fields: ["top_ports", "tcp_ports", "udp_ports"],
          },
          {
            path: "scan.detailed",
            fields: ["top_ports", "tcp_ports", "udp_ports"],
          },
        ],
        conditional: [
          {
            path: "scan.fast",
            controller: "use_top_ports",
            showWhenTrue: ["top_ports"],
            showWhenFalse: ["tcp_ports", "udp_ports"],
          },
          {
            path: "scan.detailed",
            controller: "use_top_ports",
            showWhenTrue: ["top_ports"],
            showWhenFalse: ["tcp_ports", "udp_ports"],
          },
        ],
      };
      return { ...cfg, _ui: uiMeta };
    },
  },
  mutations: {
    async setNmapConfiguration(parent, { configuration }) {
      // Incoming shape expected:
      // { ui: { STATUS_SLEEP }, scan: { fast: { use_top_ports, top_ports, tcp_ports, udp_ports, fast_scan }, detailed: { use_top_ports, top_ports, tcp_ports, udp_ports } }, __ui?: { mutuallyExclusive: [{ path: "scan.fast", fields: ["top_ports","tcp_ports","udp_ports"]}, ...] } }
      const current = await getStoredConfig();

      const next = { ...current };
      const mutuallyExclusive = configuration?._ui?.mutuallyExclusive ?? [];
      if (configuration?.ui) {
        next.ui.STATUS_SLEEP = Number(
          configuration.ui.STATUS_SLEEP ?? next.ui.STATUS_SLEEP
        );
      }
      if (configuration?.scan?.fast) {
        const f = configuration.scan.fast;
        const fastMx = new Set(
          mutuallyExclusive.find((m) => m.path === "scan.fast")?.fields || []
        );
        next.scan.fast.use_top_ports = !!(
          f.use_top_ports ?? next.scan.fast.use_top_ports
        );
        if (next.scan.fast.use_top_ports) {
          next.scan.fast.top_ports = Number(
            f.top_ports ?? next.scan.fast.top_ports ?? 1000
          );
          if (fastMx.has("tcp_ports")) next.scan.fast.tcp_ports = [];
          if (fastMx.has("udp_ports")) next.scan.fast.udp_ports = [];
        } else {
          next.scan.fast.top_ports = null;
          next.scan.fast.tcp_ports = parsePorts(
            f.tcp_ports ?? next.scan.fast.tcp_ports
          );
          next.scan.fast.udp_ports = parsePorts(
            f.udp_ports ?? next.scan.fast.udp_ports
          );
        }
        if (f.fast_scan !== undefined) next.scan.fast.fast_scan = !!f.fast_scan;
      }
      if (configuration?.scan?.detailed) {
        const d = configuration.scan.detailed;
        const detMx = new Set(
          mutuallyExclusive.find((m) => m.path === "scan.detailed")?.fields ||
            []
        );
        next.scan.detailed.use_top_ports = !!(
          d.use_top_ports ?? next.scan.detailed.use_top_ports
        );
        if (next.scan.detailed.use_top_ports) {
          next.scan.detailed.top_ports = Number(
            d.top_ports ?? next.scan.detailed.top_ports ?? 1000
          );
          if (detMx.has("tcp_ports")) next.scan.detailed.tcp_ports = [];
          if (detMx.has("udp_ports")) next.scan.detailed.udp_ports = [];
        } else {
          next.scan.detailed.top_ports = null;
          next.scan.detailed.tcp_ports = parsePorts(
            d.tcp_ports ?? next.scan.detailed.tcp_ports
          );
          next.scan.detailed.udp_ports = parsePorts(
            d.udp_ports ?? next.scan.detailed.udp_ports
          );
        }
      }

      const saved = await saveConfig(next);

      // Update in-memory plugin settings so subsequent scans use new values without restart
      try {
        if (saved?.ui?.STATUS_SLEEP !== undefined) {
          NmapSettings.STATUS_SLEEP = saved.ui.STATUS_SLEEP;
        }
        if (saved?.scan?.fast) {
          const f = saved.scan.fast;
          if (f.use_top_ports) {
            NmapSettings.scan_configurations.fast.top_ports =
              f.top_ports ?? 1000;
            NmapSettings.scan_configurations.fast.tcp_ports = [];
            NmapSettings.scan_configurations.fast.udp_ports = [];
          } else {
            NmapSettings.scan_configurations.fast.top_ports = null;
            NmapSettings.scan_configurations.fast.tcp_ports = f.tcp_ports ?? [];
            NmapSettings.scan_configurations.fast.udp_ports = f.udp_ports ?? [];
          }
          if (f.fast_scan !== undefined) {
            NmapSettings.scan_configurations.fast.fast_scan = !!f.fast_scan;
          }
        }
        if (saved?.scan?.detailed) {
          const d = saved.scan.detailed;
          if (d.use_top_ports) {
            NmapSettings.scan_configurations.detailed.top_ports =
              d.top_ports ?? 1000;
            NmapSettings.scan_configurations.detailed.tcp_ports = [];
            NmapSettings.scan_configurations.detailed.udp_ports = [];
          } else {
            NmapSettings.scan_configurations.detailed.top_ports = null;
            NmapSettings.scan_configurations.detailed.tcp_ports =
              d.tcp_ports ?? ["1-65535"];
            NmapSettings.scan_configurations.detailed.udp_ports =
              d.udp_ports ?? [];
          }
        }
      } catch (e) {
        // Non-fatal; logs for visibility
        PenPal.Log?.warn?.(
          "Nmap: failed to update in-memory settings after save",
          e?.message
        );
      }
      // Return with UI metadata so client can keep labeled sections without refresh
      const uiMeta = {
        sections: [
          { path: "ui", label: "General" },
          { path: "scan.fast", label: "Fast Scan" },
          { path: "scan.detailed", label: "Detailed Scan" },
        ],
        mutuallyExclusive: [
          {
            path: "scan.fast",
            fields: ["top_ports", "tcp_ports", "udp_ports"],
          },
          {
            path: "scan.detailed",
            fields: ["top_ports", "tcp_ports", "udp_ports"],
          },
        ],
        conditional: [
          {
            path: "scan.fast",
            controller: "use_top_ports",
            showWhenTrue: ["top_ports"],
            showWhenFalse: ["tcp_ports", "udp_ports"],
          },
          {
            path: "scan.detailed",
            controller: "use_top_ports",
            showWhenTrue: ["top_ports"],
            showWhenFalse: ["tcp_ports", "udp_ports"],
          },
        ],
      };
      return { ...saved, _ui: uiMeta };
    },
  },
};
