// Overall PenPal coordinating server code
import PenPal from "#penpal/core";

// Plugin-specific info
import Plugin from "./plugin.ts";
import Manifest from "./manifest.json" with { type: "json" };

// Register the plugin
PenPal.registerPlugin(Manifest, Plugin);

