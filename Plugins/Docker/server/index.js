// Overall PenPal coordinating server code
import PenPal from "meteor/penpal";

// Plugin-specific info 
import Plugin from "./plugin.js";
import Manifest from "./manifest.json";

// Register the plugin
PenPal.registerPlugin(Manifest, Plugin);

// Create Template API for other Other APIs to populate (may not be needed)
PenPal.API = {}

// Create Template DataStore for other DataStores to populate
PenPal.DataStore = {}