import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const { Card, CardContent } = Components.Card;
const { Button } = Components.Button;

const ProjectViewTitleBar = ({ project }) => {
  return (
    <Card className="mb-4">
      <CardContent className="flex flex-row items-center p-4">
        <div className="text-3xl mr-8">{project.name}</div>
        <div className="text-xl text-muted-foreground max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">
          {project.description}
        </div>
        <div className="flex-1" />
        <div className="flex items-center">
          {project.customer.name}
          <Button variant="ghost" size="icon" className="ml-2">
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

registerComponent("ProjectViewTitleBar", ProjectViewTitleBar);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewTitleBar;
