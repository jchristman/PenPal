import React, { useState } from "react";
import moment from "moment";

import { Components } from "meteor/penpal";
import { SetupProviders } from "stories/common.js";

export const Workflow = () => (
  <SetupProviders>
    <Components.NewProjectWorkflow open={true} handleClose={() => null} />
  </SetupProviders>
);

export const Step1SelectCustomer = () => (
  <SetupProviders>
    <div
      style={{
        width: 1000,
        height: 600,
        border: "1px solid black",
        background: "white"
      }}
    >
      <Components.NewProjectWorkflowSelectCustomer customers={[]} />
    </div>
  </SetupProviders>
);

export const Step2DetailsAndScope = () => {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStartDate, setProjectStartDate] = useState(null);
  const [projectEndDate, setProjectEndDate] = useState(null);
  const [projectIPs, setProjectIPs] = useState([]);
  const [projectNetworks, setProjectNetworks] = useState([]);

  return (
    <SetupProviders>
      <div
        style={{
          width: 1000,
          height: 600,
          border: "1px solid black",
          background: "white"
        }}
      >
        <Components.NewProjectWorkflowProjectDetails
          projectName={projectName}
          setProjectName={setProjectName}
          projectDescription={projectDescription}
          setProjectDescription={setProjectDescription}
          projectStartDate={projectStartDate}
          setProjectStartDate={setProjectStartDate}
          projectEndDate={projectEndDate}
          setProjectEndDate={setProjectEndDate}
          projectIPs={projectIPs}
          setProjectIPs={setProjectIPs}
          projectNetworks={projectNetworks}
          setProjectNetworks={setProjectNetworks}
        />
      </div>
    </SetupProviders>
  );
};

export const Step3Review = () => {
  const customers = [{ name: "Test Customer" }];
  const selectedCustomer = 0;
  const [projectName, setProjectName] = useState("Test Project");
  const [projectDescription, setProjectDescription] = useState(
    "Test project description"
  );
  const [projectStartDate, setProjectStartDate] = useState(moment());
  const [projectEndDate, setProjectEndDate] = useState(null);
  const [projectIPs, setProjectIPs] = useState(["192.168.1.1", "192.168.1.2"]);
  const [projectNetworks, setProjectNetworks] = useState(["192.168.1.0/24"]);

  return (
    <SetupProviders>
      <div
        style={{
          width: 1000,
          height: 600,
          border: "1px solid black",
          background: "white"
        }}
      >
        <Components.NewProjectWorkflowReview
          customers={customers}
          selectedCustomer={selectedCustomer}
          projectName={projectName}
          projectDescription={projectDescription}
          projectStartDate={projectStartDate}
          projectEndDate={projectEndDate}
          projectIPs={projectIPs}
          projectNetworks={projectNetworks}
        />
      </div>
    </SetupProviders>
  );
};

export default {
  title: "PenPal/CoreAPI/New Project Workflow"
};
