import React, { useState, useEffect } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";
import { PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

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

const {
  Button,
  ToggleGroup,
  ToggleGroupItem,
  Separator,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Input,
} = Components;

const _actions = [
  { icon: TableViewIcon, name: TableViewName },
  { icon: TimelineViewIcon, name: TimelineViewName },
  { icon: CardViewIcon, name: CardViewName },
];

const Projects = () => {
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [view, setView] = useState(_actions[0].name);
  const [isLoading, setIsLoading] = useState(false);

  // Search state management
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term with 1 second delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleNewProjectOpen = () => setNewProjectOpen(true);
  const handleNewProjectClose = () => setNewProjectOpen(false);

  const handleLoadingChange = (loading) => {
    setIsLoading(loading);
  };

  const toolbarActions = [
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
  ];

  return (
    <div className="h-full w-full flex-grow relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col">
        {/* Always visible toolbar */}
        <div className="flex-shrink-0 w-full mb-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex items-center justify-between gap-4">
            {/* Left side - Loading indicator and Search */}
            <div className="flex items-center gap-4">
              {/* Search input */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                {isLoading && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  </div>
                )}
                {debouncedSearchTerm && (
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    Searching for "{debouncedSearchTerm}"
                  </span>
                )}
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              {toolbarActions.map(({ group, exclusive }, index) => (
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
                          disabled={view === item.name}
                          className="flex items-center justify-center p-2 toolbar-btn-hover cursor-pointer"
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
                          className="flex items-center justify-center p-2 toolbar-btn-hover cursor-pointer"
                        >
                          {item.icon}
                        </Button>
                      ))}
                    </div>
                  )}
                  {index !== toolbarActions.length - 1 && (
                    <Separator orientation="vertical" className="h-6" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 w-full">
          <Components.ProjectsView
            view={view}
            onLoadingChange={handleLoadingChange}
            searchTerm={searchTerm}
            debouncedSearchTerm={debouncedSearchTerm}
          />
        </div>

        <Components.NewProjectWorkflow
          open={newProjectOpen}
          handleClose={handleNewProjectClose}
        />
      </div>
    </div>
  );
};

registerComponent("Projects", Projects);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Projects;
