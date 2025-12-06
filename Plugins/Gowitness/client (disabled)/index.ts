// @ts-nocheck
// Client-side plugin registration
import PenPal from "@penpal/core";
import Plugin from "./plugin.ts";
import Manifest from "./manifest.json" with { type: "json" };

// Register the client plugin
PenPal.registerPlugin(Manifest, Plugin); 