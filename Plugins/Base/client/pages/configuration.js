import React from "react";
import { Components, registerComponent } from "meteor/penpal";
import _ from "lodash";

import Grid from "@material-ui/core/Grid";

const Configuration = () => {
  return <Components.ConfigurationSelector />;
};

registerComponent("Configuration", Configuration);
