import React from "react";
import { Components, registerComponent } from "@penpal/core";

const Configuration = () => {
  return <Components.ConfigurationSelector />;
};

registerComponent("Configuration", Configuration);
