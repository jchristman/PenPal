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
  Squares2X2Icon,
  ServerIcon,
  GlobeAltIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

const {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Skeleton,
} = Components;

const StatBadge = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-2">
    <Icon className="h-5 w-5 text-muted-foreground" />
    <div className="flex items-center space-x-1">
      <span className="font-semibold">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  </div>
);

const ProjectCardSkeleton = () => (
  <Card className="flex flex-col h-full">
    <CardHeader className="pb-4">
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-1 mt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </CardHeader>
    <CardContent className="flex-grow flex flex-col justify-between space-y-4">
      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-2/4" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-y-3 pt-4 border-t border-border/50">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-5 w-4" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-5 w-4" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-5 w-4" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const handleNavigate = (project_id) => {
    navigate(`/projects/${project_id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const projectDuration = (start, end) => {
    if (!start || !end) return "Dates not set";
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <Card
      className="flex flex-col h-full cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-200 bg-card"
      onClick={() => handleNavigate(project.id)}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold tracking-tight">
          {project.name}
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2 h-8">
          {project.description || "No description provided."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{project.customer.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>
              {projectDuration(project.dates.start, project.dates.end)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-3 pt-4 border-t border-border/50">
          <StatBadge
            icon={GlobeAltIcon}
            label="Networks"
            value={project.stats.networks}
          />
          <StatBadge
            icon={ComputerDesktopIcon}
            label="Hosts"
            value={project.stats.totalHosts}
          />
          <StatBadge
            icon={ServerIcon}
            label="Services"
            value={project.stats.totalServices}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const ProjectsViewCardView = ({
  projects = [],
  page,
  setPage,
  pageSize = 10,
  totalCount = 0,
  isLoading = false,
}) => {
  const [displayedProjects, setDisplayedProjects] = useState([]);

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
    return displayedProjects.map((project) => {
      const directHosts = project.scope?.hostsConnection?.totalCount || 0;
      const directServices =
        project.scope?.hostsConnection?.servicesConnection?.totalCount || 0;
      const networks = project.scope?.networksConnection?.totalCount || 0;
      const networkHosts =
        project.scope?.networksConnection?.hostsConnection?.totalCount || 0;
      const networkServices =
        project.scope?.networksConnection?.hostsConnection?.servicesConnection
          ?.totalCount || 0;

      const totalHosts = directHosts + networkHosts;
      const totalServices = directServices + networkServices;

      return {
        ...project,
        stats: {
          networks,
          totalHosts,
          totalServices,
        },
      };
    });
  }, [displayedProjects]);

  if (page === 0 && isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: pageSize }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (enhancedProjects.length === 0 && !isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-muted-foreground">No projects found.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {enhancedProjects.map((project, index) => {
          if (enhancedProjects.length === index + 1) {
            return (
              <div ref={lastProjectElementRef} key={project.id}>
                <ProjectCard project={project} />
              </div>
            );
          } else {
            return (
              <div key={project.id}>
                <ProjectCard project={project} />
              </div>
            );
          }
        })}
      </div>
      {isLoading && page > 0 && (
        <div className="flex justify-center items-center p-6">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export const Icon = <Squares2X2Icon className="h-4 w-4" />;
export const Name = "Card View";

registerComponent("ProjectsViewCardView", ProjectsViewCardView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectsViewCardView;
