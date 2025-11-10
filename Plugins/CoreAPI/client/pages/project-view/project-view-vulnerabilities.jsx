import React, { useState } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";

import { useQuery } from "@apollo/client";
import getVulnerabilitiesInformation from "./queries/get-vulnerabilities-information.js";

const { useToast } = Hooks;

const ProjectViewVulnerabilities = ({ project, disable_polling }) => {
  const { toast } = useToast();

  const { data, loading, error } = useQuery(getVulnerabilitiesInformation, {
    pollInterval: disable_polling ? 0 : 15000,
    variables: {
      projectID: project.id,
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

  const { getVulnerabilitiesByProjectID: vulnerabilities = [] } = data || {};

  const tabs = [
    {
      value: "dashboard",
      label: "Dashboard",
      content: (
        <Components.ProjectViewVulnerabilitiesDashboard
          vulnerabilities={vulnerabilities}
        />
      ),
    },
    {
      value: "table",
      label: "Table",
      content: (
        <Components.ProjectViewVulnerabilitiesTable
          project={project}
          vulnerabilities={vulnerabilities}
        />
      ),
    },
  ];

  return <Components.VerticalTabs tabs={tabs} defaultTab="dashboard" />;
};

registerComponent("ProjectViewVulnerabilities", ProjectViewVulnerabilities);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewVulnerabilities;

