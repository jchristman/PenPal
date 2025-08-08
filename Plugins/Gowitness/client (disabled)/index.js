// Client-side plugin registration
import PenPal from "@penpal/core";
import Plugin from "./plugin.js";
import Manifest from "./manifest.json" with { type: "json" };

// Register the client plugin
PenPal.registerPlugin(Manifest, Plugin); 