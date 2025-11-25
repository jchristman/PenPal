import React, { useState } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";

import { useQuery } from "@apollo/client";
import getDomainsByProject from "./queries/get-domains-by-project.ts";

const { useToast } = Hooks;

const ProjectViewDomains = ({ project, disable_polling }: { project: { id: string }; disable_polling: boolean }) => {
  const { toast } = useToast();

  const { data, loading, error } = useQuery(getDomainsByProject, {
    pollInterval: disable_polling ? 0 : 15000,
    variables: {
      projectId: project.id,
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

  const { getDomainsByProject: domainsData } = data || {};
  const domains = domainsData?.domains || [];

  const tabs = [
    {
      value: "dashboard",
      label: "Dashboard",
      content: <Components.ProjectViewDomainsDashboard domains={domains} />,
    },
    {
      value: "table",
      label: "Table",
      content: <Components.ProjectViewDomainsTable domains={domains} />,
    },
    {
      value: "graph",
      label: "Graph",
      content: <Components.ProjectViewDomainsGraph domains={domains} />,
    },
  ];

  return <Components.VerticalTabs tabs={tabs} defaultTab="dashboard" />;
};

registerComponent("ProjectViewDomains", ProjectViewDomains);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewDomains;
