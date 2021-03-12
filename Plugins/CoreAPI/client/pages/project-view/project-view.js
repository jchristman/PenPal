import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "meteor/penpal";
import { useSnackbar } from "notistack";
import { makeStyles } from "@material-ui/core/styles";

import { useQuery } from "@apollo/client";
import GetProjectDetails from "./queries/get-project-details.js";

const useStyles = makeStyles((theme) => ({
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column"
  }
}));

const ProjectView = ({ project_id, disable_polling = false }) => {
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();

  const { loading, error, data: { getProject: project } = {} } = useQuery(
    GetProjectDetails,
    {
      pollInterval: disable_polling ? 0 : 15000,
      variables: {
        id: project_id
      }
    }
  );

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
      <Components.ProjectViewDataContainer project={project} />
    </div>
  );
};

registerComponent("ProjectView", ProjectView);
