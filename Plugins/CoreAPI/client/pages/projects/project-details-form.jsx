import React, { useState } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";

const { cn } = Utils;
const { Input, Label } = Components;

const ProjectDetailsForm = ({
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  projectStartDate,
  setProjectStartDate,
  projectEndDate,
  setProjectEndDate,
}) => {
  const handleProjectNameChange = (event) => setProjectName(event.target.value);
  const handleProjectDescriptionChange = (event) =>
    setProjectDescription(event.target.value);

  return (
    <div className="flex flex-col justify-center items-start h-full w-full space-y-4">
      <div className="w-[300px]">
        <Label htmlFor="project-name">Name *</Label>
        <Input
          id="project-name"
          required
          value={projectName}
          onChange={handleProjectNameChange}
          className="w-full"
        />
      </div>

      <div className="w-[300px]">
        <Label htmlFor="project-description">Description *</Label>
        <Input
          id="project-description"
          required
          value={projectDescription}
          onChange={handleProjectDescriptionChange}
          className="w-full"
        />
      </div>

      <div className="w-[300px]">
        <Components.Calendar
          value={projectStartDate}
          onChange={setProjectStartDate}
          label="Start Date"
          className="w-full"
        />
      </div>

      <div className="w-[300px]">
        <Components.Calendar
          disabled={projectStartDate === null}
          shouldDisableDate={(date) => date.isBefore(projectStartDate, "day")}
          value={projectEndDate}
          onChange={setProjectEndDate}
          label="End Date"
          className="w-full"
        />
      </div>
    </div>
  );
};

registerComponent("ProjectDetailsForm", ProjectDetailsForm);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectDetailsForm;
