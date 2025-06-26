import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";

const { Tabs, TabsContent, TabsList, TabsTrigger } = Components.Tabs;

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
  const [activeTab, setActiveTab] = useState("hosts");

  const tabs = [
    {
      value: "hosts",
      label: "Hosts",
      component: Components.ProjectViewHosts,
    },
    {
      value: "services",
      label: "Services",
      component: Components.ProjectViewServices,
    },
    {
      value: "networks",
      label: "Networks",
      component: Components.ProjectViewNetworks,
    },
  ];

  return (
    <div className="flex-1 w-full bg-transparent flex flex-col overflow-y-auto">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="px-1">
          {tabs.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(({ value, component: Component }) => (
          <TabsContent
            key={value}
            value={value}
            className="flex-1 flex overflow-y-auto mt-4"
          >
            <Component project={project} disable_polling={disable_polling} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

registerComponent("ProjectViewDataContainer", ProjectViewDataContainer);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewDataContainer;
