import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const { Button } = Components;

const ProjectViewTitleBar = ({ project }) => {
  return (
    <div className="flex flex-row items-center p-4 border-b border-black">
      <div className="text-3xl mr-8">{project.name}</div>
      <div className="text-xl text-muted-foreground max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">
        {project.description}
      </div>
      <div className="flex-1" />
      <div className="flex items-center">
        {project.customer.name}
        <Button variant="outline" className="ml-4">
          <ArrowTopRightOnSquareIcon className="size-4 mr-2" />
          View Customer
        </Button>
      </div>
    </div>
  );
};

registerComponent("ProjectViewTitleBar", ProjectViewTitleBar);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewTitleBar;
