import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import { ComputerDesktopIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@apollo/client";
import getVulnerabilitiesInformation from "./queries/get-vulnerabilities-information.js";

const ProjectViewDashboard = ({ project }) => {
  const { data: vulnerabilitiesData } = useQuery(getVulnerabilitiesInformation, {
    variables: { projectID: project.id },
    pollInterval: 15000,
  });

  const vulnerabilities =
    vulnerabilitiesData?.getVulnerabilitiesByProjectID || [];
  const criticalHighVulns =
    vulnerabilities.filter(
      (v) => v.severity === "CRITICAL" || v.severity === "HIGH"
    ).length || 0;
  const nucleiVulns =
    vulnerabilities.filter((v) => v.discoveredBy === "Nuclei").length || 0;

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 xl:col-span-4 lg:col-span-4 sm:col-span-6">
        <Components.DashboardTrendingStatistic
          title="Independent Hosts"
          value={project.scope.hostsConnection.totalCount}
          delta={0}
          icon={<ComputerDesktopIcon className="h-6 w-6" />}
          caption={``}
        />
      </div>
      <div className="col-span-12 xl:col-span-4 lg:col-span-4 sm:col-span-6">
        <Components.DashboardTrendingStatistic
          title="Independent Host Services"
          value={project.scope.hostsConnection.servicesConnection.totalCount}
          delta={0}
          icon={<ComputerDesktopIcon className="h-6 w-6" />}
          caption={``}
        />
      </div>
      <div className="col-span-12 xl:col-span-4 lg:col-span-4 sm:col-span-6">
        <Components.DashboardTrendingStatistic
          title="Networks"
          value={project.scope.networksConnection.totalCount}
          delta={0}
          icon={<ComputerDesktopIcon className="h-6 w-6" />}
          caption={``}
        />
      </div>
      <div className="col-span-12 xl:col-span-4 lg:col-span-4 sm:col-span-6">
        <Components.DashboardTrendingStatistic
          title="Network Hosts"
          value={project.scope.networksConnection.hostsConnection.totalCount}
          delta={0}
          icon={<ComputerDesktopIcon className="h-6 w-6" />}
          caption={``}
        />
      </div>
      <div className="col-span-12 xl:col-span-4 lg:col-span-4 sm:col-span-6">
        <Components.DashboardTrendingStatistic
          title="Network Host Services"
          value={
            project.scope.networksConnection.hostsConnection.servicesConnection
              .totalCount
          }
          delta={0}
          icon={<ComputerDesktopIcon className="h-6 w-6" />}
          caption={``}
        />
      </div>
      <div className="col-span-12 xl:col-span-4 lg:col-span-4 sm:col-span-6">
        <Components.DashboardTrendingStatistic
          title="Vulnerabilities"
          value={vulnerabilities.length}
          delta={0}
          icon={<ShieldExclamationIcon className="h-6 w-6" />}
          caption={`${criticalHighVulns} Critical/High`}
        />
      </div>
      <div className="col-span-12 xl:col-span-4 lg:col-span-4 sm:col-span-6">
        <Components.DashboardTrendingStatistic
          title="Nuclei Findings"
          value={nucleiVulns}
          delta={0}
          icon={<ShieldExclamationIcon className="h-6 w-6" />}
          caption={`Automated discoveries`}
        />
      </div>
    </div>
  );
};

registerComponent("ProjectViewDashboard", ProjectViewDashboard);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewDashboard;
