import React, { useState } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";

import { useQuery } from "@apollo/client";
import getNetworksInformation from "./queries/get-networks-information.js";

const { useToast } = Hooks;

const ProjectViewNetworks = ({ project, disable_polling }) => {
  const { toast } = useToast();

  const { data, loading, error } = useQuery(getNetworksInformation, {
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

  const {
    getProject: { scope: { networksConnection: { networks = [] } } = {} } = {},
  } = data || {};

  const tabs = [
    {
      value: "dashboard",
      label: "Dashboard",
      content: <Components.ProjectViewNetworksDashboard networks={networks} />,
    },
    {
      value: "table",
      label: "Table",
      content: <Components.ProjectViewNetworksTable networks={networks} />,
    },
    {
      value: "graph",
      label: "Graph",
      content: <Components.ProjectViewNetworksGraph networks={networks} />,
    },
  ];

  return <Components.VerticalTabs tabs={tabs} defaultTab="dashboard" />;
};

registerComponent("ProjectViewNetworks", ProjectViewNetworks);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewNetworks;
