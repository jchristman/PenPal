import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";

import { useQuery } from "@apollo/client";
import GetProjectSummaries from "./queries/get-project-summaries.js";

import { Name as CardViewName } from "./views-card-view.jsx";
import { Name as TableViewName } from "./views-table-view.jsx";
import { Name as TimelineViewName } from "./views-timeline-view.jsx";

const ProjectsView = ({
  view,
  onLoadingChange,
  searchTerm,
  debouncedSearchTerm,
}) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 20, { label: "All", value: -1 }];

  // Sorting state management
  const [sort, setSort] = useState({ key: "name", direction: "asc" });

  // Buffered data state to prevent flickering during page changes
  const [bufferedData, setBufferedData] = useState({
    projects: [],
    totalCount: 0,
  });

  // Reset to first page when search changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchTerm]);

  // Reset to first page when sort changes
  useEffect(() => {
    setPage(0);
  }, [sort]);

  const {
    loading: projectSummariesLoading,
    error: projectSummariesError,
    data: { getProjects } = {},
  } = useQuery(GetProjectSummaries, {
    pollInterval: 15000,
    variables: {
      pageSize,
      pageNumber: page,
      searchTerm: debouncedSearchTerm || undefined, // Only include if not empty
      sortBy: sort.key,
      sortDirection: sort.direction,
    },
    // Force a fresh fetch when search term or sort changes to avoid cache conflicts
    fetchPolicy:
      debouncedSearchTerm || sort ? "cache-and-network" : "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(projectSummariesLoading);
    }
  }, [projectSummariesLoading, onLoadingChange]);

  // Update buffered data only when new data is successfully loaded
  useEffect(() => {
    if (!projectSummariesLoading && getProjects) {
      setBufferedData({
        projects: getProjects.projects || [],
        totalCount: getProjects.totalCount || 0,
      });
    }
  }, [projectSummariesLoading, getProjects]);

  const commonProps = {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageSizeOptions,
    projects: bufferedData.projects,
    totalCount: bufferedData.totalCount,
    isLoading: projectSummariesLoading,
    searchTerm,
    debouncedSearchTerm,
    sort,
    setSort, // Pass sorting state and setter to table component
  };

  return view === TableViewName ? (
    <Components.ProjectsViewTableView {...commonProps} />
  ) : view === TimelineViewName ? (
    <Components.ProjectsViewTimelineView {...commonProps} />
  ) : (
    <Components.ProjectsViewCardView {...commonProps} />
  );
};

registerComponent("ProjectsView", ProjectsView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectsView;
