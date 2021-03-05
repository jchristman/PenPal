import React from "react";
import { Components, registerComponent } from "meteor/penpal";
import CalendarViewDayIcon from "@material-ui/icons/CalendarViewDay";

const ProjectsViewTimelineView = ({ projects }) => {
  return null;
};

export const Icon = <CalendarViewDayIcon />;
export const Name = "Timeline View";

registerComponent("ProjectsViewTimelineView", ProjectsViewTimelineView);
