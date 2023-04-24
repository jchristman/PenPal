import React from "react";
import { Components, registerComponent } from "@penpal/core";
import _ from "lodash";

import Grid from "@mui/material/Grid";

const Configuration = () => {
  return <Components.ConfigurationSelector />;
};

registerComponent("Configuration", Configuration);
