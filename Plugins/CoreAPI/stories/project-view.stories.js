import React, { useState } from "react";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";
import { project } from "./mocks/get-project-details.js";

export const FullPage = () => (
  <SetupProviders>
    <Components.ProjectView project_id={"1234"} disable_polling={true} />
  </SetupProviders>
);

export const TitleBar = () => (
  <SetupProviders>
    <Components.ProjectViewTitleBar project={project} />
  </SetupProviders>
);

export const DataContainer = () => (
  <SetupProviders>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%"
      }}
    >
      <Components.ProjectViewDataContainer project={project} />
    </div>
  </SetupProviders>
);

export const Dashboard = () => (
  <SetupProviders>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%"
      }}
    >
      <Components.ProjectViewDashboard project={project} />
    </div>
  </SetupProviders>
);

export const Hosts = () => (
  <SetupProviders>
    <Components.ProjectViewHosts project={project} />
  </SetupProviders>
);

export const Networks = () => (
  <SetupProviders>
    <Components.ProjectViewNetworks project={project} />
  </SetupProviders>
);

export default {
  title: "PenPal/CoreAPI/Project View"
};
