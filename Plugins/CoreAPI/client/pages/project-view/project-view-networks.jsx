import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";

const { Tabs, TabsContent, TabsList, TabsTrigger } = Components.Tabs;

const ProjectViewNetworks = ({ project }) => {
  const [activeTab, setActiveTab] = useState("list");

  const tabs = [
    {
      value: "list",
      label: "List",
      content: () => (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Networks List Coming Soon
        </div>
      ),
    },
    {
      value: "hosts",
      label: "Hosts",
      content: () => (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Networks Hosts View Coming Soon
        </div>
      ),
    },
    {
      value: "services",
      label: "Services",
      content: () => (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Networks Services View Coming Soon
        </div>
      ),
    },
    {
      value: "graph",
      label: "Graph",
      content: () => (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Networks Graph View Coming Soon
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex h-full">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        orientation="vertical"
        className="flex-1 flex h-full"
      >
        <TabsList className="h-full w-48 flex flex-col justify-start p-1 bg-muted/50 border-r">
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
              <Content project={project} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

registerComponent("ProjectViewNetworks", ProjectViewNetworks);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewNetworks;
