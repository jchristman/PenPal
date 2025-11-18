import React, { useState, useEffect } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";

import { useQuery } from "@apollo/client";
import getServicesInformation from "./queries/get-services-information.js";

const { useToast } = Hooks;

const ProjectViewServices = ({ project, disable_polling }) => {
  const { toast } = useToast();

  const { data, loading, error } = useQuery(getServicesInformation, {
    pollInterval: disable_polling ? 0 : 15000,
    variables: {
      id: project.id,
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (loading) {
    return null;
  }

  if (error) {
    return null;
  }

  const { getServices: services = [] } = data || {};

  const tabs = [
    {
      value: "dashboard",
      label: "Dashboard",
      content: <Components.ProjectViewServicesDashboard services={services} />,
    },
    {
      value: "table",
      label: "Table",
      content: (
        <Components.ProjectViewServicesTable
          project={project}
          services={services}
        />
      ),
    },
    {
      value: "enrichments",
      label: "Enrichments",
      content: (
        <Components.ProjectViewServicesEnrichments
          project={project}
          services={services}
        />
      ),
    },
  ];

  return (
    <div className="w-full h-full overflow-hidden">
      <Components.VerticalTabs tabs={tabs} defaultTab="dashboard" />
    </div>
  );
};

registerComponent("ProjectViewServices", ProjectViewServices);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewServices;
