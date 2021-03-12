import React from "react";
import { Components, registerComponent } from "meteor/penpal";
import ViewModuleIcon from "@material-ui/icons/ViewModule";

const ProjectsViewCardView = ({ projects }) => {
  return null;
};

export const Icon = <ViewModuleIcon />;
export const Name = "Card View";

registerComponent("ProjectsViewCardView", ProjectsViewCardView);
