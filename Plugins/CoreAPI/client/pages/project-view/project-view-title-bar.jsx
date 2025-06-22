import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    left: 0,
    right: 0,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  project_name: {
    fontSize: 30,
    marginRight: theme.spacing(4),
  },
  project_description: {
    fontSize: 20,
    color: "rgba(0, 0, 0, 0.54)",
    maxWidth: 300,
    overflowX: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  flex: {
    flex: 1,
  },
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

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewTitleBar;
