import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import PenPal from "@penpal/core";
import { useSearchParams } from "react-router-dom";
import ProjectViewConfiguration from "./project-view-configuration";

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

// Initialize a simple registry API for contributing tabs to the Project view
if (!PenPal.API) PenPal.API = {};
if (!PenPal.API.ProjectViewTabsRegistry) {
  PenPal.API.ProjectViewTabsRegistry = [];
}

// Register function allows other plugins to add tabs
PenPal.API.registerProjectViewTab = (tabDescriptor) => {
  const { value, label, render, order = 100 } = tabDescriptor || {};
  if (!value || !label || typeof render !== "function") return;
  PenPal.API.ProjectViewTabsRegistry.push({ value, label, render, order });
};

const ProjectViewDataContainer = ({ project, disable_polling }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab from URL, default to "details"
  const activeTab = searchParams.get("tab") || "details";

  const handleTabChange = (value) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", value);
      // Reset view when changing tabs
      newParams.delete("view");
      return newParams;
    });
  };

  // Core tabs + contributed tabs
  const coreTabs = [
    {
      value: "details",
      label: "Scope",
      content: () => (
        <Components.ProjectViewDetails
          project={project}
          disable_polling={disable_polling}
        />
      ),
    },
    {
      value: "configuration",
      label: "Configuration",
      content: () => (
        <ProjectViewConfiguration
          project={project}
          disable_polling={disable_polling}
        />
      ),
    },
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
    {
      value: "vulnerabilities",
      label: "Vulnerabilities",
      content: () => (
        <Components.ProjectViewVulnerabilities
          project={project}
          disable_polling={disable_polling}
        />
      ),
    },
  ];

  const contributedTabs = (PenPal.API.ProjectViewTabsRegistry || [])
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
    .map((tab) => ({
      value: tab.value,
      label: tab.label,
      content: () => tab.render({ project, disable_polling, Components }),
    }));

  const tabs = [...coreTabs, ...contributedTabs];

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
      <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
        {tabs.find((tab) => tab.value === activeTab)?.content()}
      </div>
    </div>
  );
};

registerComponent("ProjectViewDataContainer", ProjectViewDataContainer);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewDataContainer;
