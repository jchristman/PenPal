import React, { useState } from "react";
import { Components, registerComponent } from "meteor/penpal";
import _ from "lodash";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";

import { borderRadius } from "./styled-common.js";

const useStyles = makeStyles((theme) => ({
  root: {
    fontSize: "0.9rem",
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius
  }
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
