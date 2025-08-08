import React, { useState } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";

import { useQuery } from "@apollo/client";
import getHostsInformation from "./queries/get-hosts-information.js";

const { useToast } = Hooks;

const ProjectViewHosts = ({ project, disable_polling }) => {
  const { toast } = useToast();

  const { data, loading, error } = useQuery(getHostsInformation, {
    pollInterval: disable_polling ? 0 : 15000,
    variables: {
      id: project.id,
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

  const { getHostsByProjectID: hosts = [] } = data || {};

  const tabs = [
    {
      value: "dashboard",
      label: "Dashboard",
      content: <Components.ProjectViewHostsDashboard hosts={hosts} />,
    },
    {
      value: "table",
      label: "Table",
      content: <Components.ProjectViewHostsTable hosts={hosts} />,
    },
    {
      value: "graph",
      label: "Graph",
      content: <Components.ProjectViewHostsGraph hosts={hosts} />,
    },
  ];

  return <Components.VerticalTabs tabs={tabs} defaultTab="dashboard" />;
};

registerComponent("ProjectViewHosts", ProjectViewHosts);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewHosts;
