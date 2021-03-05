import React from "react";
import { registerComponent, Components } from "meteor/penpal";

import SOURCE from "./fedora-icon-src.js";
const ICON_NAME = "FedoraIcon";

export const IconAttribution = {
  icon: {
    name: "Fedora icon",
    link: "https://www.iconfinder.com/icons/386460/fedora_icon"
  },
  by: {
    name: "Aha-Soft",
    link: "https://www.iconfinder.com/aha-soft"
  },
  license: {
    name: "CC BY 3.0",
    link: "https://creativecommons.org/licenses/by/3.0/us"
  }
};

/* ------------------------------------------------ */

const _Icon = ({ width = 40, height = 40 }) => (
  <img style={{ width, height }} src={SOURCE} />
);

registerComponent(ICON_NAME, _Icon);
