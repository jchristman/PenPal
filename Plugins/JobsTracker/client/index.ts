// Overall PenPal coordinating server code
import PenPal from "@penpal/core";

// Plugin-specific info
import Plugin from "./plugin.ts";
import Manifest from "./manifest.json" with { type: "json" };
import type { PenPalPluginManifest } from "@penpal/types";

// Import components
import "./components/jobs-counter.jsx";

// Register the plugin
PenPal.registerPlugin(Manifest as PenPalPluginManifest, Plugin);
