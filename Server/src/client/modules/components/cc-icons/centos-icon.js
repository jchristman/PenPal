import React from "react";
import { registerComponent, Components } from "meteor/penpal";

import SOURCE from "./centos-icon-src.js";
const ICON_NAME = "CentosIcon";

export const IconAttribution = {
  icon: {
    name: "Cent os, centos icon",
    link: "https://www.iconfinder.com/icons/386454/cent_os_centos_icon"
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
