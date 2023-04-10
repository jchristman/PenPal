// Overall PenPal coordinating server code
import PenPal from "PenPal";

// Plugin-specific info
import Plugin from "./plugin.js";
import Manifest from "./manifest.json";

// Register the plugin
PenPal.registerPlugin(Manifest, Plugin);
