import React from "react";
import { registerComponent, Components } from "meteor/penpal";

//import SOURCE from "./-icon-src.js";
const ICON_NAME = "Icon";

export const IconAttribution = {
  icon: {
    name: "",
    link: "https://www.iconfinder.com/icons/CHANGE"
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
