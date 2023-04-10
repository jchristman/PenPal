import React from "react";
import { Components, registerComponent } from "PenPal";
import _ from "lodash";

import Grid from "@material-ui/core/Grid";

const Configuration = () => {
  return <Components.ConfigurationSelector />;
};

registerComponent("Configuration", Configuration);
