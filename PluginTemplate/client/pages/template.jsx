import React from "react";
import { registerComponent } from "@penpal/core";

const REPLACE_MEComponent = () => {
  return (
    <div>Congrats! You have correctly configured a new PenPal Plugin!</div>
  );
};

registerComponent("REPLACE_ME", REPLACE_MEComponent);
