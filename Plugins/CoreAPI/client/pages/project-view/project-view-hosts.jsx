import React, { useState } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";

import { useQuery } from "@apollo/client";
import getHostsInformation from "./queries/get-hosts-information.js";

const { Tabs, TabsContent, TabsList, TabsTrigger } = Components.Tabs;
const { useToast } = Hooks;

const ProjectViewHosts = ({ project, disable_polling }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");

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

  const { getProject: { hosts } = { hosts: [] } } = data || {};

  const tabs = [
    {
      value: "list",
      label: "List",
      content: ({ project, hosts }) => (
        <Components.ProjectViewHostsList project={project} hosts={hosts} />
      ),
    },
    {
      value: "dashboard",
      label: "Dashboard",
      content: () => (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Hosts Dashboard Coming Soon
        </div>
      ),
    },
    {
      value: "graph",
      label: "Graph",
      content: () => (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Hosts Graph Coming Soon
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
              <Content project={project} hosts={hosts} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

registerComponent("ProjectViewHosts", ProjectViewHosts);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewHosts;
