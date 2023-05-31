import "regenerator-runtime/runtime";

// Import settings
import "./settings.js";

// Now render stuff
import PenPal, { Components } from "./penpal/client.js";
import React from "react";
import { render } from "react-dom";

// This needs to happen before importing the plugins so that some core functionalities get registered
import "./modules/components/root.jsx";

// Load the plugins' code
import Plugins from "@penpal/plugins";

// Render the root component
(async () => {
  await Plugins.registerPlugins();
  await PenPal.loadPlugins();
  render(<Components.Root />, document.getElementById("app"));
})();
