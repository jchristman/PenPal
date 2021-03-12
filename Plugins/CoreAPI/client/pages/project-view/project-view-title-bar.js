import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "meteor/penpal";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    left: 0,
    right: 0,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  project_name: {
    fontSize: 30,
    marginRight: theme.spacing(4)
  },
  project_description: {
    fontSize: 20,
    color: "rgba(0, 0, 0, 0.54)",
    maxWidth: 300,
    overflowX: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  flex: {
    flex: 1
  }
}));

const ProjectViewTitleBar = ({ project }) => {
  const classes = useStyles();

  return (
    <Paper className={classes.container}>
      <div className={classes.project_name}>{project.name}</div>
      <div className={classes.project_description}>{project.description}</div>
      <div className={classes.flex} />
      <div className={classes.customer}>
        {project.customer.name}{" "}
        <IconButton>
          <OpenInNewIcon />
        </IconButton>
      </div>
    </Paper>
  );
};

registerComponent("ProjectViewTitleBar", ProjectViewTitleBar);
