import React, { useState, useEffect } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";
import { useSearchParams } from "react-router-dom";

import { useQuery } from "@apollo/client";
import GetProjectDetails from "./queries/get-project-details.js";

const { useToast, Card } = Hooks;

const ProjectView = ({ project_id, disable_polling = false }) => {
  const { toast } = useToast();

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
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
    return null;
  }

  return (
    <Components.Card className="w-full h-full flex flex-col overflow-hidden">
      <Components.ProjectViewTitleBar project={project} />
      <div className="flex-1 overflow-hidden min-h-0">
        <Components.ProjectViewDataContainer
          project={project}
          disable_polling={disable_polling}
        />
      </div>
    </Components.Card>
  );
};

registerComponent("ProjectView", ProjectView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectView;
