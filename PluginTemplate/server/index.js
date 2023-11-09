// Overall PenPal coordinating server code
import PenPal from "#penpal/core";

// Plugin-specific info
import Plugin from "./plugin.js";
import Manifest from "./manifest.json" assert { type: "json" };

// Register the plugin
PenPal.registerPlugin(Manifest, Plugin);
