// Overall PenPal coordinating client code
import PenPal from "@penpal/core";

// Plugin-specific info
import Plugin from "./plugin.js";
import Manifest from "./manifest.json";

console.log(Manifest, Plugin);

// Register the plugin
PenPal.registerPlugin(Manifest, Plugin);
