import React, { useState } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";

import { useQuery } from "@apollo/client";
import getServicesInformation from "./queries/get-services-information.js";

const { Tabs, TabsContent, TabsList, TabsTrigger } = Components.Tabs;
const { useToast } = Hooks;

const ProjectViewServices = ({ project, disable_polling }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");

  const { data, loading, error } = useQuery(getServicesInformation, {
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

  const { getProject: { services } = { services: [] } } = data || {};

  const tabs = [
    {
      value: "list",
      label: "List",
      content: ({ project, services }) => (
        <Components.ProjectViewServicesList
          project={project}
          services={services}
        />
      ),
    },
    {
      value: "enrichments",
      label: "Enrichments",
      content: ({ project, services }) => (
        <Components.ProjectViewServicesEnrichments
          project={project}
          services={services}
        />
      ),
    },
    {
      value: "dashboard",
      label: "Dashboard",
      content: () => (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Services Dashboard Coming Soon
        </div>
      ),
    },
    {
      value: "graph",
      label: "Graph",
      content: () => (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Services Graph Coming Soon
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        orientation="vertical"
        className="w-full h-full flex"
      >
        <TabsList className="h-full w-48 flex-col justify-start">
          {tabs.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="w-full justify-start"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex-1 pl-8 pr-8">
          {tabs.map(({ value, content: Content }) => (
            <TabsContent key={value} value={value} className="mt-4">
              <Content project={project} services={services} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

registerComponent("ProjectViewServices", ProjectViewServices);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewServices;
