import React from "react";
import { Components, registerComponent } from "@penpal/core";
import CalendarViewDayIcon from "@mui/icons-material/CalendarViewDay";

const ProjectsViewTimelineView = ({ projects }) => {
  return null;
};

export const Icon = <CalendarViewDayIcon />;
export const Name = "Timeline View";

registerComponent("ProjectsViewTimelineView", ProjectsViewTimelineView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectsViewTimelineView;
