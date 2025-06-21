import React from "react";
import { registerComponent, Components } from "@penpal/core";

import SOURCE from "./red-lock-icon-src.js";
const ICON_NAME = "Icon";

export const IconAttribution = {
  icon: {
    name: "Lock, red icon",
    link: "https://www.iconfinder.com/icons/1891028/lock_red_icon",
  },
  by: {
    name: "Julia Osadcha",
    link: "https://www.iconfinder.com/Juliia_Os",
  },
  license: {
    name: "Free for commercial use",
    link: "",
  },
};

/* ------------------------------------------------ */

const _Icon = ({ width = 40, height = 40 }) => (
  <img style={{ width, height }} src={SOURCE} />
);

registerComponent(ICON_NAME, _Icon);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default _Icon;
