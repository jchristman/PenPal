import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { Components, registerComponent } from "@penpal/core";
import {
  CalendarDaysIcon,
  ServerIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

const { Card, CardContent, CardHeader, CardTitle, Skeleton } = Components;

const TimelineItemSkeleton = () => (
  <div className="relative pl-12">
    <div className="absolute left-4 top-1 w-4 h-4 bg-muted rounded-full border-4 border-background -translate-x-1/2"></div>
    <div className="flex flex-col">
      <Skeleton className="h-5 w-48 mb-2" />
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <div className="flex items-center space-x-2 pt-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
            <div className="flex items-center space-x-1.5">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center space-x-1.5">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center space-x-1.5">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const TimelineItem = ({ project }) => {
  const navigate = useNavigate();
  const handleNavigate = (project_id) => {
    navigate(`/projects/${project_id}`);
  };

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-200 bg-card w-full"
      onClick={() => handleNavigate(project.id)}
    >
      <CardHeader>
        <CardTitle className="text-md font-bold">{project.name}</CardTitle>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pt-1">
          <UserGroupIcon className="h-4 w-4" />
          <span>{project.customer.name}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground line-clamp-2 h-8">
          {project.description || "No description provided."}
        </p>
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50 text-xs">
          <div className="flex items-center space-x-1.5">
            <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{project.stats.networks}</span>
            <span className="text-muted-foreground">Networks</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <ComputerDesktopIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{project.stats.totalHosts}</span>
            <span className="text-muted-foreground">Hosts</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <ServerIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{project.stats.totalServices}</span>
            <span className="text-muted-foreground">Services</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProjectsViewTimelineView = ({
  projects = [],
  page,
  setPage,
  pageSize = 10,
  totalCount = 0,
  isLoading = false,
  sort,
  setSort,
}) => {
  const [displayedProjects, setDisplayedProjects] = useState([]);

  useEffect(() => {
    // Enforce chronological sorting for the timeline view
    if (sort?.key !== "start" || sort?.direction !== "asc") {
      setSort({ key: "start", direction: "asc" });
    }
  }, [sort, setSort]);

  useEffect(() => {
    if (page === 0) {
      setDisplayedProjects(projects);
      return;
    }
    if (projects?.length > 0) {
      setDisplayedProjects((prevProjects) => {
        const existingIds = new Set(prevProjects.map((p) => p.id));
        const newProjects = projects.filter((p) => !existingIds.has(p.id));
        return [...prevProjects, ...newProjects];
      });
    }
  }, [projects, page]);

  const observer = useRef();
  const hasMore = displayedProjects.length < totalCount;

  const lastProjectElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(page + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, page, setPage]
  );

  const enhancedProjects = useMemo(() => {
    return displayedProjects.map((project) => ({
      ...project,
      stats: {
        networks: project.scope?.networksConnection?.totalCount || 0,
        totalHosts:
          (project.scope?.hostsConnection?.totalCount || 0) +
          (project.scope?.networksConnection?.hostsConnection?.totalCount || 0),
        totalServices:
          (project.scope?.hostsConnection?.servicesConnection?.totalCount ||
            0) +
          (project.scope?.networksConnection?.hostsConnection
            ?.servicesConnection?.totalCount || 0),
      },
    }));
  }, [displayedProjects]);

  const formatDate = (dateString, includeYear = false) => {
    if (!dateString) return "Date not set";
    const options = { month: "long", day: "numeric" };
    if (includeYear) {
      options.year = "numeric";
    }
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  if (page === 0 && isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="relative">
          <div
            className="absolute top-0 left-4 h-full w-0.5 bg-border -translate-x-1/2"
            aria-hidden="true"
          ></div>
          <div className="relative flex flex-col gap-12">
            {Array.from({ length: pageSize }).map((_, index) => (
              <TimelineItemSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (enhancedProjects.length === 0 && !isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-muted-foreground">No projects found for timeline.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="relative">
        <div
          className="absolute top-0 left-4 h-full w-0.5 bg-border -translate-x-1/2"
          aria-hidden="true"
        ></div>
        <div className="relative flex flex-col gap-12">
          {enhancedProjects.map((project, index) => (
            <div
              ref={
                enhancedProjects.length === index + 1
                  ? lastProjectElementRef
                  : null
              }
              key={project.id}
              className="relative pl-12"
            >
              <div className="absolute left-4 top-1 w-4 h-4 bg-primary rounded-full border-4 border-background -translate-x-1/2"></div>
              <div className="flex flex-col">
                <time className="font-semibold text-primary text-sm mb-2">
                  {formatDate(project.dates.start, true)}
                </time>
                <TimelineItem project={project} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {isLoading && page > 0 && (
        <div className="flex justify-center items-center p-6 mt-8">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export const Icon = <CalendarDaysIcon className="h-4 w-4" />;
export const Name = "Timeline View";

registerComponent("ProjectsViewTimelineView", ProjectsViewTimelineView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectsViewTimelineView;
