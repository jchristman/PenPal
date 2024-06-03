import React from "react";
import { useQuery } from "@apollo/client";
import { Components, registerComponent } from "@penpal/core";

import GetPluginJobs from "./queries/get-all-jobs.js";

const JobsPage = () => {
  const { loading, error, data } = useQuery(GetPluginJobs, {
    pollInterval: 500,
  });

  if (loading) return "Loading...";

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

registerComponent("JobsPage", JobsPage);
