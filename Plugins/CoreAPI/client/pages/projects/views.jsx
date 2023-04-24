import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";

import { useQuery } from "@apollo/client";
import GetProjectSummaries from "./queries/get-project-summaries.js";

import { Name as CardViewName } from "./views-card-view.jsx";
import { Name as TableViewName } from "./views-table-view.jsx";
import { Name as TimelineViewName } from "./views-timeline-view.jsx";

const ProjectsView = ({ view }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [projectSummaries, setProjectSummaries] = useState({
    projects: [],
    totalCount: 0,
  });
  const pageSizeOptions = [5, 10, 20, { label: "All", value: -1 }];

  const {
    loading: projectSummariesLoading,
    error: projectSummariesError,
    data: { getProjects } = {},
  } = useQuery(GetProjectSummaries, {
    pollInterval: 15000,
    variables: {
      pageSize,
      pageNumber: page,
    },
  });

  // This is a way to essentially buffer the changes from the GraphQL query so that it looks smoother in the UI
  useEffect(() => {
    if (getProjects !== undefined) {
      setProjectSummaries(getProjects);
    }
  }, [getProjects]);

  return view === TableViewName ? (
    <Components.ProjectsViewTableView
      page={page}
      setPage={setPage}
      pageSize={pageSize}
      setPageSize={setPageSize}
      pageSizeOptions={pageSizeOptions}
      projectSummaries={projectSummaries}
    />
  ) : view === TimelineViewName ? (
    <Components.ProjectsViewTimelineView
      page={page}
      setPage={setPage}
      pageSize={pageSize}
      setPageSize={setPageSize}
      pageSizeOptions={pageSizeOptions}
      projectSummaries={projectSummaries}
    />
  ) : (
    <Components.ProjectsViewCardView
      page={page}
      setPage={setPage}
      pageSize={pageSize}
      setPageSize={setPageSize}
      pageSizeOptions={pageSizeOptions}
      projectSummaries={projectSummaries}
    />
  );
};

registerComponent("ProjectsView", ProjectsView);
