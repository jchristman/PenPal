import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { useSearchParams } from "react-router-dom";

const { Tabs, TabsContent, TabsList, TabsTrigger } = Components;

export const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
      className="mt-4 flex-1 overflow-y-auto"
    >
      {value === index ? children : null}
    </div>
  );
};

const ProjectViewDataContainer = ({ project, disable_polling }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab from URL, default to "networks"
  const activeTab = searchParams.get("tab") || "networks";

  const handleTabChange = (value) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", value);
      // Reset view when changing tabs
      newParams.delete("view");
      return newParams;
    });
  };

  const tabs = [
    {
      value: "networks",
      label: "Networks",
      content: () => <Components.ProjectViewNetworks project={project} />,
    },
    {
      value: "hosts",
      label: "Hosts",
      content: () => (
        <Components.ProjectViewHosts
          project={project}
          disable_polling={disable_polling}
        />
      ),
    },
    {
      value: "services",
      label: "Services",
      content: () => (
        <Components.ProjectViewServices
          project={project}
          disable_polling={disable_polling}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Horizontal tabs using Tabs components with black border */}
      <div className="border-b border-black">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-auto p-0 bg-transparent">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors rounded-none ${
                  activeTab === tab.value
                    ? "border-primary text-primary border-b-2" // Thicker orange underline and orange text
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col h-full">
        {tabs.find((tab) => tab.value === activeTab)?.content()}
      </div>
    </div>
  );
};

registerComponent("ProjectViewDataContainer", ProjectViewDataContainer);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewDataContainer;
