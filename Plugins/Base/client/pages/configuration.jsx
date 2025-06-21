import React from "react";
import { Components, registerComponent } from "@penpal/core";

const Configuration = () => {
  return <Components.ConfigurationSelector />;
};

registerComponent("Configuration", Configuration);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Configuration;
