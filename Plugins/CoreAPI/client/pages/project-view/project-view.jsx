import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import { useSnackbar } from "notistack";
import { makeStyles } from "@mui/styles";

import { useQuery } from "@apollo/client";
import GetProjectDetails from "./queries/get-project-details.js";

const useStyles = makeStyles((theme) => ({
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
}));

const ProjectView = ({ project_id, disable_polling = false }) => {
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();

  const {
    loading,
    error,
    data: { getProject: project } = {},
  } = useQuery(GetProjectDetails, {
    pollInterval: disable_polling ? 0 : 15000,
    variables: {
      id: project_id,
    },
  });

  if (loading) {
    return null;
  }

  if (error) {
    enqueueSnackbar(error.message, { variant: "error" });
    return null;
  }

  return (
    <div className={classes.container}>
      <Components.ProjectViewTitleBar project={project} />
      <Components.ProjectViewDataContainer
        project={project}
        disable_polling={disable_polling}
      />
    </div>
  );
};

registerComponent("ProjectView", ProjectView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectView;
