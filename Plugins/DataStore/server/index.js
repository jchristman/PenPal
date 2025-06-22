// Overall PenPal coordinating server code
import PenPal from "#penpal/core";

PenPal.DataStore = PenPal.DataStore || {};

// Plugin-specific info
import Plugin from "./plugin.js";
import Manifest from "./manifest.json" with { type: "json" };

// Register the plugin
PenPal.registerPlugin(Manifest, Plugin);
