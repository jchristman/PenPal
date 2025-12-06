// @ts-nocheck
// Overall PenPal coordinating client code
import PenPal from "@penpal/core";

// Plugin-specific info
import Plugin from "./plugin.ts";
import Manifest from "./manifest.json";

// Register the plugin
PenPal.registerPlugin(Manifest, Plugin);
