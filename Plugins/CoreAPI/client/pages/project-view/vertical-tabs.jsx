import React from "react";
import { Components, registerComponent } from "@penpal/core";
import { useSearchParams } from "react-router-dom";

const { Tabs, TabsContent, TabsList, TabsTrigger } = Components;

const VerticalTabs = ({ tabs, defaultTab = "list" }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active view from URL, default to provided defaultTab
  const activeTab = searchParams.get("view") || defaultTab;

  const handleTabChange = (value) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("view", value);
      return newParams;
    });
  };

  return (
    <div className="w-full h-full">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        orientation="vertical"
        className="w-full h-full flex"
      >
        <div className="border-r border-black">
          <TabsList className="h-full w-48 flex-col justify-start items-start bg-transparent p-0 rounded-none">
            {tabs.map((tab) => (
              <div className="w-full">
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`w-full justify-start border-b-2 rounded-none px-4 py-3 font-medium text-sm relative ${
                    activeTab === tab.value
                      ? "border-b-2 text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </TabsTrigger>
              </div>
            ))}
          </TabsList>
        </div>
        <div className="flex-1 pl-8 pr-8">
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {tab.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

registerComponent("VerticalTabs", VerticalTabs);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default VerticalTabs;
