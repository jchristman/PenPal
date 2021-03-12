import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "meteor/penpal";
import { useParams } from "react-router-dom";

const Project = (props) => {
  let { project_id } = useParams();

  if (project_id === undefined) {
    if (props.project_id === undefined) {
      return "Cannot render without a project_id prop or /projects/:project_id route";
    }

    project_id = props.project_id;
  }

  return <Components.ProjectView project_id={project_id} />;
};

registerComponent("Project", Project);
