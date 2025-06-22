// Overall PenPal coordinating server code
import PenPal from "#penpal/core";

console.log("Creating PenPal.API");
PenPal.API = PenPal.API || {};
PenPal.API.InterfaceResolvers = PenPal.API.InterfaceResolvers || {};

// Plugin-specific info
import Plugin from "./plugin.js";
import Manifest from "./manifest.json" with { type: "json" };

// Register the plugin
PenPal.registerPlugin(Manifest, Plugin);
