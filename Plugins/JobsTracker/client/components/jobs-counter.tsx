import React, { useState, useEffect } from "react";
import { useQuery, useSubscription } from "@apollo/client";
import { Components, registerComponent } from "@penpal/core";
import { COMPLETED_STATUSES } from "../../common/job-constants.ts";

import GetAllJobs from "../pages/jobs/queries/get-all-jobs.ts";
import JobsSubscription from "../pages/jobs/queries/jobs-subscription.ts";
import JobCreatedSubscription from "../pages/jobs/queries/job-created-subscription.ts";
import JobDeletedSubscription from "../pages/jobs/queries/job-deleted-subscription.ts";

const { Badge } = Components;

const JobsCounter: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);

  useQuery(GetAllJobs, {
    variables: { filterMode: "all" },
    onCompleted: (data) => {
      setJobs(data.getAllJobs.jobs);
    },
    fetchPolicy: "network-only",
  });

  useSubscription(JobsSubscription, {
    onData: ({ data }) => {
      const updatedJob = data.data.jobUpdated;
      setJobs((prevJobs) => {
        const index = prevJobs.findIndex((job) => job.id === updatedJob.id);
        if (index > -1) {
          const newJobs = [...prevJobs];
          newJobs[index] = updatedJob;
          return newJobs;
        }
        // If the job is not in the list, it might be a new job that arrived before the creation subscription.
        // To be safe, let's just refetch. This is a bit of a workaround for potential race conditions.
        return prevJobs;
      });
    },
  });

  useSubscription(JobCreatedSubscription, {
    onData: ({ data }) => {
      const newJob = data.data.jobCreated;
      setJobs((prevJobs) => [newJob, ...prevJobs]);
    },
  });

  useSubscription(JobDeletedSubscription, {
    onData: ({ data }) => {
      const deletedJobId = data.data.jobDeleted;
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== deletedJobId));
    },
  });

  const activeJobsCount = jobs.filter(
    (job) => !COMPLETED_STATUSES.includes(job.status)
  ).length;

  return (
    <Badge variant={activeJobsCount > 0 ? "default" : "outline"}>
      {`Active Jobs: ${activeJobsCount}`}
    </Badge>
  );
};

registerComponent("JobsCounter", JobsCounter);
export default JobsCounter;
