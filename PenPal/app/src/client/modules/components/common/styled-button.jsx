import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import _ from "lodash";
import { makeStyles, useTheme } from "@mui/styles";
import Button from "@mui/material/Button";

import { borderRadius } from "./styled-common.js";

const useStyles = makeStyles((theme) => ({
  root: {
    fontSize: "0.9rem",
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius,
  },
}));

const StyledButton = (props) => {
  const classes = useStyles();

  const buttonProps = _.merge(
    { variant: "contained", color: "default" },
    props
  );

  return <Button {...buttonProps} className={classes.root} />;
};

registerComponent("StyledButton", StyledButton);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default StyledButton;
