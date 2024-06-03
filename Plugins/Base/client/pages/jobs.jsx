import React from "react";
import { Components, registerComponent } from "@penpal/core";

const Jobs = () => {
  return <Components.JobsPage />;
};

registerComponent("Jobs", Jobs);
