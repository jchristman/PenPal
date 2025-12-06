import React, { useState, useEffect } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";
import _ from "lodash";

const { cn } = Utils;
const { Separator } = Components;

interface ProjectDetailsProps {
  enableNext?: () => void;
  disableNext?: () => void;
  projectName: string;
  setProjectName: (name: string) => void;
  projectDescription: string;
  setProjectDescription: (desc: string) => void;
  projectStartDate: Date | null;
  setProjectStartDate: (date: Date | null) => void;
  projectEndDate: Date | null;
  setProjectEndDate: (date: Date | null) => void;
  projectIPs: string[];
  setProjectIPs: (ips: string[]) => void;
  projectNetworks: string[];
  setProjectNetworks: (networks: string[]) => void;
  projectDomains: string[];
  setProjectDomains: (domains: string[]) => void;
  projectProfile: any;
  setProjectProfile: (profile: any) => void;
}

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
  projectDomains,
  setProjectDomains,
  projectProfile,
  setProjectProfile,
}: ProjectDetailsProps) => {
  useEffect(() => {
    if (projectName.length !== 0 && projectDescription.length !== 0) {
      enableNext();
    } else {
      disableNext();
    }
  }, [projectName, projectDescription]);

  return (
    <div className="w-full h-full flex flex-row justify-evenly items-stretch">
      <div className="h-[calc(100%-2rem)] flex flex-col justify-start items-start flex-1 m-4">
        <div className="text-[#555] text-[17px] uppercase w-full text-center mb-2 min-w-[300px]">
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
            projectProfile={projectProfile}
            setProjectProfile={setProjectProfile}
          />
        </div>
      </div>
      <Separator orientation="vertical" className="h-auto mx-4" />
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
            projectDomains={projectDomains}
            setProjectDomains={setProjectDomains}
          />
        </div>
      </div>
    </div>
  );
};

registerComponent("NewProjectWorkflowProjectDetails", ProjectDetails);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectDetails;
