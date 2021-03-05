// Import settings
import "./settings.js";

// Now render stuff
import { Meteor } from "meteor/meteor";
import PenPal, { Components } from "meteor/penpal";
import React from "react";
import { render } from "react-dom";

// Render the root component -- the ? is for storybook to not fall over
Meteor?.startup(async () => {
  await PenPal.loadPlugins();
  render(<Components.Root />, document.getElementById("app"));
});
