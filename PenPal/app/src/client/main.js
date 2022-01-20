// Import settings
import "./settings.js";

// Now render stuff
import PenPal, { Components } from "./penpal";
import React from "react";
import { render } from "react-dom";

// Render the root component
(async () => {
  await PenPal.loadPlugins();
  render(<Components.Root />, document.getElementById("app"));
})();
