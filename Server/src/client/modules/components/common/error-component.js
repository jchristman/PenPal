import React from "react";
import { Components, registerComponent } from "meteor/penpal";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";

const useStyles = makeStyles({
  container: {
    position: "absolute",
    backgroundColor: "#EEE",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },

  error_box: {
    maxWidth: "50%",
    maxHeight: "50%",
    paddingTop: 10,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 10
  },

  inline: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
  },

  message_container: {
    overflow: "scroll"
  }
});

const ErrorDisplay = ({ err_number, message, stack }) => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <Paper square className={classes.error_box}>
        <h3 className={classes.inline}>
          <ErrorOutlineIcon />
          &nbsp;&nbsp;Error #{err_number}
        </h3>
        <p>
          An error has occured. Please inform the PLEXworx dev team of this
          error and any steps you took to trigger it.
        </p>
        <p className={classes.message_container}>
          <pre>{message}</pre>
          <pre>{stack}</pre>
        </p>
      </Paper>
    </div>
  );
};

registerComponent("ErrorDisplay", ErrorDisplay);
