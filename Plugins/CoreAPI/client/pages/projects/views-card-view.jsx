import React from "react";
import { Components, registerComponent } from "@penpal/core";
import { Squares2X2Icon } from "@heroicons/react/24/outline";

const ProjectsViewCardView = ({ projects }) => {
  return null;
};

export const Icon = <Squares2X2Icon />;
export const Name = "Card View";

registerComponent("ProjectsViewCardView", ProjectsViewCardView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectsViewCardView;
