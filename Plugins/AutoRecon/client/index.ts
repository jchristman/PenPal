// Overall PenPal coordinating client code
import PenPal from "@penpal/core";

// Plugin-specific info
import Plugin from "./plugin";
import Manifest from "./manifest.json";

import type { PenPalPluginManifest } from "@penpal/types";

// Register the plugin
PenPal.registerPlugin(Manifest as PenPalPluginManifest, Plugin);
