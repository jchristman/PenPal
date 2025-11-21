import "regenerator-runtime/runtime";

// Import settings
import "./settings.ts";

// Now render stuff
import PenPal, { Components } from "./penpal/client.ts";
import React from "react";
import { createRoot } from "react-dom/client";

// This needs to happen before importing the plugins so that some core functionalities get registered
import "./components/root.tsx";

// Force load user provider to ensure hooks are registered
import "./components/common/user-provider";

// Load the plugins' code
import Plugins from "../plugins/plugins-loader-client.js";

// Render the root component
(async () => {
  await Plugins.registerPlugins();
  await PenPal.loadPlugins();
  const appElement = document.getElementById("app");
  if (appElement) {
    const root = createRoot(appElement);
    root.render(<Components.Root />);
  } else {
    console.error("Could not find element with id 'app'");
  }
})();
