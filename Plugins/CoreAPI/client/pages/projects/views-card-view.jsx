import React from "react";
import { Components, registerComponent } from "@penpal/core";
import ViewModuleIcon from "@mui/icons-material/ViewModule";

const ProjectsViewCardView = ({ projects }) => {
  return null;
};

export const Icon = <ViewModuleIcon />;
export const Name = "Card View";

registerComponent("ProjectsViewCardView", ProjectsViewCardView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectsViewCardView;
