import React, { useState, useEffect } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";
import {
  PencilIcon,
  XMarkIcon,
  PlusIcon,
  WrenchScrewdriverIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import {
  Icon as CardViewIcon,
  Name as CardViewName,
} from "./projects/views-card-view.jsx";
import {
  Icon as TableViewIcon,
  Name as TableViewName,
} from "./projects/views-table-view.jsx";
import {
  Icon as TimelineViewIcon,
  Name as TimelineViewName,
} from "./projects/views-timeline-view.jsx";

const { Button, ToggleGroup, ToggleGroupItem, Separator } = Components;

const _actions = [
  { icon: TableViewIcon, name: TableViewName },
  { icon: TimelineViewIcon, name: TimelineViewName },
  { icon: CardViewIcon, name: CardViewName },
];

const Projects = () => {
  const [fabVisible, setFabVisible] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [view, setView] = useState(_actions[0].name);

  const handleNewProjectOpen = () => setNewProjectOpen(true);
  const handleNewProjectClose = () => setNewProjectOpen(false);

  const actions = fabVisible
    ? [
        {
          icon: <WrenchScrewdriverIcon className="h-4 w-4" />,
          name: "Show Toolbar",
          onClick: () => {
            setFabVisible(false);
          },
        },
        ..._actions.map((action) => ({
          ...action,
          onClick: () => setView(action.name),
        })),
        {
          icon: <PlusIcon className="h-4 w-4" />,
          name: "New Project",
          onClick: () => {
            setTimeout(handleNewProjectOpen, 200);
          },
        },
      ]
    : [
        {
          group: [
            {
              icon: <PlusIcon className="h-4 w-4" />,
              onClick: (event) => {
                event.preventDefault();
                handleNewProjectOpen();
              },
            },
          ],
          exclusive: false,
        },
        {
          group: _actions,
          exclusive: true,
        },
        {
          group: [
            {
              name: view, // A hack to make this always a "depressed" value
              icon: <WrenchScrewdriverIcon className="h-4 w-4" />,
              onClick: (event) => {
                event.preventDefault();
                setFabVisible(true);
              },
            },
          ],
          exclusive: false,
        },
      ];

  return (
    <div className="h-full w-full flex-grow relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col">
        {!fabVisible && (
          <div className="flex-shrink-0 w-full mb-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex items-center justify-end gap-2">
              {actions.map(({ group, exclusive }, index) => (
                <React.Fragment key={index}>
                  {exclusive ? (
                    <ToggleGroup
                      type="single"
                      value={view}
                      onValueChange={(newView) => newView && setView(newView)}
                      className="flex"
                    >
                      {group.map((item, itemIndex) => (
                        <ToggleGroupItem
                          key={itemIndex}
                          value={item.name || ""}
                          onClick={item.onClick}
                          className="flex items-center justify-center p-2"
                        >
                          {item.icon}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  ) : (
                    <div className="flex">
                      {group.map((item, itemIndex) => (
                        <Button
                          key={itemIndex}
                          variant="outline"
                          size="sm"
                          onClick={item.onClick}
                          className="flex items-center justify-center p-2"
                        >
                          {item.icon}
                        </Button>
                      ))}
                    </div>
                  )}
                  {index !== actions.length - 1 && (
                    <Separator orientation="vertical" className="h-6" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 w-full">
          <Components.ProjectsView view={view} />
        </div>

        <Components.NewProjectWorkflow
          open={newProjectOpen}
          handleClose={handleNewProjectClose}
        />

        {/* Mobile FAB for when toolbar is hidden */}
        {fabVisible && (
          <div className="fixed bottom-4 right-4 z-10">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 space-y-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={action.onClick}
                  className="w-full justify-start gap-2"
                >
                  <action.icon className="size-6 text-black-500" />
                  {action.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

registerComponent("Projects", Projects);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Projects;
