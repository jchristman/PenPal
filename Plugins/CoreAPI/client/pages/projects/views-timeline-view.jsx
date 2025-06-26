import React from "react";
import { Components, registerComponent } from "@penpal/core";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

const ProjectsViewTimelineView = ({ projects }) => {
  return null;
};

export const Icon = <CalendarDaysIcon className="h-4 w-4" />;
export const Name = "Timeline View";

registerComponent("ProjectsViewTimelineView", ProjectsViewTimelineView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectsViewTimelineView;
