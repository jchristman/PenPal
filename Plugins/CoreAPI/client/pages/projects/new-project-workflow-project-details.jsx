import React, { useState, useEffect } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";
import _ from "lodash";

const { cn } = Utils;
const { Separator } = Components;

const ProjectDetails = ({
  enableNext = () => null,
  disableNext = () => null,
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  projectStartDate,
  setProjectStartDate,
  projectEndDate,
  setProjectEndDate,
  projectIPs,
  setProjectIPs,
  projectNetworks,
  setProjectNetworks,
}) => {
  useEffect(() => {
    if (projectName.length !== 0 && projectDescription.length !== 0) {
      enableNext();
    } else {
      disableNext();
    }
  }, [projectName, projectDescription]);

  return (
    <div className="w-full h-full flex flex-row justify-evenly items-center">
      <div className="h-[calc(100%-2rem)] flex flex-col justify-center items-start flex-1 m-4">
        <div className="text-[#555] text-[17px] uppercase w-full text-center mb-2">
          Details
        </div>
        <div className="flex-1 w-full flex flex-col justify-center items-start">
          <Components.ProjectDetailsForm
            projectName={projectName}
            setProjectName={setProjectName}
            projectDescription={projectDescription}
            setProjectDescription={setProjectDescription}
            projectStartDate={projectStartDate}
            setProjectStartDate={setProjectStartDate}
            projectEndDate={projectEndDate}
            setProjectEndDate={setProjectEndDate}
          />
        </div>
      </div>
      <Separator orientation="vertical" className="h-full mx-4" />
      <div className="h-[calc(100%-2rem)] flex flex-col justify-center items-start flex-1 m-4">
        <div className="text-[#555] text-[17px] uppercase w-full text-center mb-2">
          Scope
        </div>
        <div className="flex-1 w-full flex flex-col justify-center items-start">
          <Components.ProjectScopeForm
            projectIPs={projectIPs}
            setProjectIPs={setProjectIPs}
            projectNetworks={projectNetworks}
            setProjectNetworks={setProjectNetworks}
          />
        </div>
      </div>
    </div>
  );
};

registerComponent("NewProjectWorkflowProjectDetails", ProjectDetails);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectDetails;
