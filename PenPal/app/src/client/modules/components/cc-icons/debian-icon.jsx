import React from "react";
import { registerComponent, Components } from "@penpal/core";

import SOURCE from "./debian-icon-src.js";

export const DebianIconAttribution = {
  icon: {
    name: "Debian icon",
    link: "https://www.iconfinder.com/icons/386459/debian_icon",
  },
  by: {
    name: "Aha-Soft",
    link: "https://www.iconfinder.com/aha-soft",
  },
  license: {
    name: "CC BY 3.0",
    link: "https://creativecommons.org/licenses/by/3.0/us",
  },
};

const DebianIcon = ({ width = 40, height = 40 }) => (
  <img style={{ width, height }} src={SOURCE} />
);

registerComponent("DebianIcon", DebianIcon);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default DebianIcon;
