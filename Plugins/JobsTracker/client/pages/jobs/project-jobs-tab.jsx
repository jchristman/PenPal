import React, { useMemo, useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import { useQuery, gql } from "@apollo/client";
import { COMPLETED_STATUSES } from "../../../common/job-constants.js";

const GET_PROJECT_JOBS = gql`
  query GetProjectJobsAll {
    getAllJobs(filterMode: "all") {
      jobs {
        id
        name
        plugin
        progress
        status
        statusText
        created_at
        updated_at
        stages {
          name
          progress
          status
          statusText
        }
        project_id
      }
      totalCount
    }
  }
`;

const ProjectJobsTab = ({ project }) => {
  const { data, loading, error, refetch } = useQuery(GET_PROJECT_JOBS, {
    fetchPolicy: "cache-and-network",
  });

  const jobs = useMemo(() => {
    const all = data?.getAllJobs?.jobs || [];
    return all.filter((j) => j.project_id === project.id);
  }, [data, project?.id]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Project Jobs</h3>
        <Components.Badge>{jobs.length} jobs</Components.Badge>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <Components.Card key={job.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{job.name}</div>
                <div className="text-xs text-muted-foreground">
                  {job.plugin}
                </div>
              </div>
              <div className="w-64">
                <Components.Progress value={job.progress} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {job.status} • {job.statusText}
            </div>
          </Components.Card>
        ))}
        {jobs.length === 0 && (
          <div className="text-center text-muted-foreground p-8">
            No jobs for this project yet.
          </div>
        )}
      </div>
    </div>
  );
};

registerComponent("ProjectJobsTab", ProjectJobsTab);
export default ProjectJobsTab;
