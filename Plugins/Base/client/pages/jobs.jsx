import React from "react";
import { Components, registerComponent } from "@penpal/core";

const Jobs = () => {
  return <Components.JobsPage />;
};

registerComponent("Jobs", Jobs);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Jobs;
