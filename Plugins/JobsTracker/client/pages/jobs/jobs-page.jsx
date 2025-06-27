import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useSubscription, useMutation, gql } from "@apollo/client";
import { Components, registerComponent, Utils } from "@penpal/core";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  ListFilter,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Bell,
  Clock,
  Archive,
  Server,
  Cpu,
  Database,
  Shuffle,
  Info,
  CheckCircle2,
  XCircle,
  CircleSlash2,
} from "lucide-react";
import { formatRuntime, formatCompletionTime } from "../../utils/time-utils.js";
import {
  JobStatus,
  COMPLETED_STATUSES,
} from "../../../common/job-constants.js";

import GetAllJobs from "./queries/get-all-jobs.js";
import JobsSubscription from "./queries/jobs-subscription.js";
import JobCreatedSubscription from "./queries/job-created-subscription.js";
import JobDeletedSubscription from "./queries/job-deleted-subscription.js";
import ClearAllJobs from "./mutations/clear-all-jobs.js";

const { cn } = Utils;

const JOB_STATUS_DETAILS = {
  [JobStatus.PENDING]: {
    icon: <Clock size={16} className="text-gray-500" />,
    color: "gray",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
  },
  [JobStatus.RUNNING]: {
    icon: <RefreshCw size={16} className="text-blue-500 animate-spin" />,
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
  },
  [JobStatus.DONE]: {
    icon: <CheckCircle2 size={16} className="text-green-500" />,
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
  },
  [JobStatus.FAILED]: {
    icon: <XCircle size={16} className="text-red-500" />,
    color: "red",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
  },
  [JobStatus.CANCELLED]: {
    icon: <CircleSlash2 size={16} className="text-yellow-500" />,
    color: "yellow",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
  },
  default: {
    icon: <Info size={16} className="text-gray-500" />,
    color: "gray",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
  },
};

const getStatusDetails = (status) =>
  JOB_STATUS_DETAILS[status] || JOB_STATUS_DETAILS.default;

const ProgressBar = ({ progress, status, variant = "default", className }) => {
  const statusDetails = getStatusDetails(status);

  const isStriped =
    variant === "striped" &&
    (status === JobStatus.RUNNING || status === "busy");

  return (
    <div
      className={cn(
        "w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden",
        className
      )}
    >
      <div
        className={cn("h-2 rounded-full transition-all duration-500", {
          "bg-blue-500":
            (status === JobStatus.RUNNING && !isStriped) ||
            status === JobStatus.PENDING,
          "bg-green-500": status === JobStatus.DONE,
          "bg-red-500": status === JobStatus.FAILED,
          "bg-yellow-500": status === JobStatus.CANCELLED,
          "bg-orange-400": isStriped,
          "bg-size-200 animate-progress-stripes": isStriped,
        })}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

const findActiveStageIndex = (stages) => {
  if (stages === undefined || stages === null) return -1;
  for (let i = 0; i < stages.length; i++) {
    if (!COMPLETED_STATUSES.includes(stages[i].status)) {
      return i;
    }
  }
  return -1;
};

const StageCard = ({ stage, index, isActive, jobStatus }) => {
  const isCompleted = COMPLETED_STATUSES.includes(jobStatus);
  const isStageActive = isActive && !isCompleted;

  // A stage is "busy" if it's the active stage of a running job, but has 0 progress.
  // This is a convention from ScanQueue which creates stages that wait.
  const isBusy = isStageActive && stage.progress === 0;
  const displayStatus = isBusy ? "busy" : stage.status;
  const statusDetails = getStatusDetails(displayStatus);

  return (
    <div
      className={cn(
        "flex-1 p-3 rounded-lg border transition-all duration-300",
        isStageActive
          ? "border-blue-500 bg-blue-50/50 shadow-md"
          : "border-gray-200 bg-white",
        stage.status === JobStatus.FAILED && "border-red-300 bg-red-50"
      )}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {isStageActive && !isBusy && (
            <RefreshCw size={14} className="animate-spin text-blue-600" />
          )}
          <h6 className="font-semibold text-sm text-gray-800">{stage.name}</h6>
        </div>
        <Components.Badge
          variant={
            isBusy
              ? "warning"
              : stage.status === JobStatus.DONE
              ? "success"
              : "default"
          }
          className="capitalize"
        >
          {displayStatus}
        </Components.Badge>
      </div>
      <ProgressBar
        className="mb-4 mt-4"
        progress={isBusy ? 100 : stage.progress}
        status={displayStatus}
        variant={isBusy ? "striped" : "default"}
      />
      <p className="text-xs text-gray-500 h-4">{stage.statusText}</p>
    </div>
  );
};

const JobCard = ({ job, isExpanded, onToggleExpand }) => {
  const activeStageIndex = useMemo(
    () => findActiveStageIndex(job.stages),
    [job.stages]
  );

  const statusBorderColor = useMemo(() => {
    switch (job.status) {
      case JobStatus.RUNNING:
        return "border-blue-500";
      case JobStatus.DONE:
        return "border-green-500";
      case JobStatus.FAILED:
        return "border-red-500";
      case JobStatus.CANCELLED:
        return "border-yellow-500";
      default:
        return "border-gray-400";
    }
  }, [job.status]);

  const completedStages = job.stages.filter((s) =>
    COMPLETED_STATUSES.includes(s.status)
  ).length;

  return (
    <Components.Card
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-md",
        statusBorderColor
      )}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={job.stages.length > 0 ? onToggleExpand : undefined}
      >
        <div className="flex justify-between items-start">
          <h5 className="font-bold text-gray-800 flex-1 pr-4">{job.name}</h5>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatRuntime(job.created_at, job.completed_at)}</span>
            <span className="flex items-center gap-1.5">
              <ListFilter size={14} />
              {job.stages.length > 0
                ? `${completedStages} / ${job.stages.length} stages`
                : `${job.progress}%`}
            </span>
            {job.stages.length > 0 && (
              <Components.Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                {isExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </Components.Button>
            )}
          </div>
        </div>

        <div className="mt-2 mb-3">
          <ProgressBar progress={job.progress} status={job.status} />
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500">
          <p className="truncate pr-4">
            Currently running:{" "}
            <span className="font-medium text-gray-600">{job.statusText}</span>
          </p>
          <p className="flex-shrink-0">
            {COMPLETED_STATUSES.includes(job.status)
              ? `Completed ${formatCompletionTime(job.completed_at)}`
              : `Remaining: ${job.remainingTime || "Calculating..."}`}
          </p>
        </div>
      </div>
      {isExpanded && job.stages && job.stages.length > 0 && (
        <div className="p-4 bg-gray-50/70 border-t">
          <h6 className="text-xs font-bold uppercase text-gray-500 mb-2 pl-13">
            Stages
          </h6>
          <div className="flex flex-col gap-3">
            {job.stages.map((stage, index) => (
              <div className="flex flex-row items-center gap-3">
                <Components.Separator className="w-[40px]" />
                <StageCard
                  key={index}
                  stage={stage}
                  index={index}
                  isActive={index === activeStageIndex}
                  jobStatus={job.status}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </Components.Card>
  );
};

const PluginSection = ({
  plugin,
  jobs,
  expandedJobs,
  onToggleJobExpand,
  isCollapsed,
  onToggleCollapse,
}) => {
  const getPluginIcon = (pluginName) => {
    switch (pluginName) {
      case "CoreAPI":
        return <Database size={20} className="text-blue-500" />;
      case "Docker":
        return <Server size={20} className="text-cyan-500" />;
      case "Nmap":
      case "HttpX":
      case "Gowitness":
        return <Cpu size={20} className="text-green-500" />;
      case "ScanQueue":
        return <Shuffle size={20} className="text-purple-500" />;
      default:
        return <Info size={20} className="text-gray-500" />;
    }
  };

  return (
    <Components.Card className="mb-6">
      <Components.CardHeader
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 flex-row"
        onClick={onToggleCollapse}
      >
        <div className="flex flex-row items-center gap-3 flex-1">
          {getPluginIcon(plugin)}
          <h4 className="font-bold mb-0!">{plugin}</h4>
        </div>
        <div className="flex items-center gap-3">
          <Components.Badge>{`${jobs.length} Jobs`}</Components.Badge>
          <Components.Button variant="ghost" size="icon">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </Components.Button>
        </div>
      </Components.CardHeader>
      {!isCollapsed && (
        <Components.CardContent className="p-4 space-y-4">
          {jobs.length > 0 ? (
            jobs.map((job) => {
              const _job = { ...job, stages: job.stages || [] };
              return (
                <JobCard
                  key={job.id}
                  job={_job}
                  isExpanded={expandedJobs[job.id]}
                  onToggleExpand={() => onToggleJobExpand(job.id)}
                />
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-4">
              No jobs for this plugin.
            </p>
          )}
        </Components.CardContent>
      )}
    </Components.Card>
  );
};

const JobsPage = () => {
  const [filter, setFilter] = useState("active");
  const [jobs, setJobs] = useState([]);
  const [groupedJobs, setGroupedJobs] = useState({});
  const [expandedJobs, setExpandedJobs] = useState({});
  const [collapsedPlugins, setCollapsedPlugins] = useState({});
  const [freezeSort, setFreezeSort] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  const { loading, error, data, refetch } = useQuery(GetAllJobs, {
    variables: { filter: "all" }, // Always fetch all, filter on client
    fetchPolicy: "cache-and-network",
    onCompleted: (data) => {
      if (!freezeSort) {
        setJobs(data.getAllJobs.jobs);
      }
    },
  });

  const [clearAllJobs] = useMutation(ClearAllJobs, {
    refetchQueries: [{ query: GetAllJobs, variables: { filter: "all" } }],
  });

  useSubscription(JobsSubscription, {
    onData: ({ data }) => {
      if (freezeSort) return;
      const updatedJob = data.data.jobUpdated;
      setJobs((prevJobs) => {
        const index = prevJobs.findIndex((job) => job.id === updatedJob.id);
        if (index > -1) {
          const newJobs = [...prevJobs];
          newJobs[index] = updatedJob;
          return newJobs;
        }
        return prevJobs;
      });
    },
  });

  useSubscription(JobCreatedSubscription, {
    onData: ({ data }) => {
      if (freezeSort) return;
      const newJob = data.data.jobCreated;
      setJobs((prevJobs) => [newJob, ...prevJobs]);
    },
  });

  useSubscription(JobDeletedSubscription, {
    onData: ({ data }) => {
      if (freezeSort) return;
      const deletedJobId = data.data.jobDeleted;
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== deletedJobId));
    },
  });

  useEffect(() => {
    let filteredJobs = jobs;

    if (filter === "active") {
      filteredJobs = jobs.filter(
        (job) => !COMPLETED_STATUSES.includes(job.status)
      );
    } else if (filter === "recent") {
      const now = new Date();
      const twentyFourHoursAgo = now.getTime() - 24 * 60 * 60 * 1000;
      filteredJobs = jobs.filter((job) => {
        const createdAt = new Date(job.created_at).getTime();
        return createdAt > twentyFourHoursAgo;
      });
    }

    if (!showCompleted && filter === "all") {
      filteredJobs = jobs.filter(
        (job) => !COMPLETED_STATUSES.includes(job.status)
      );
    }

    const groups = filteredJobs.reduce((acc, job) => {
      const plugin = job.plugin || "Unassigned";
      if (!acc[plugin]) {
        acc[plugin] = [];
      }
      acc[plugin].push(job);
      return acc;
    }, {});
    setGroupedJobs(groups);
  }, [jobs, filter, showCompleted]);

  const toggleJobExpansion = (jobId) => {
    setExpandedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const togglePluginCollapse = (pluginName) => {
    setCollapsedPlugins((prev) => ({
      ...prev,
      [pluginName]: !prev[pluginName],
    }));
  };

  const handleClearAllJobs = () => setShowClearConfirm(true);
  const handleConfirmClearJobs = () => {
    clearAllJobs();
    setShowClearConfirm(false);
  };
  const handleCancelClearJobs = () => setShowClearConfirm(false);

  const activeJobsCount = jobs.filter(
    (job) => !COMPLETED_STATUSES.includes(job.status)
  ).length;

  if (loading && jobs.length === 0)
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <XCircle size={48} className="mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error loading jobs</h2>
        <p>{error.message}</p>
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <Components.Card className="mb-6 p-6 pb-2">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold mb-2">Job Tracker</h2>
            <p className="text-gray-500">
              Real-time monitoring of background tasks and processes.
            </p>
          </div>
          <Components.Badge
            variant={activeJobsCount > 0 ? "success" : "default"}
          >
            {activeJobsCount > 0
              ? `${activeJobsCount} Active Jobs`
              : "No Active Jobs"}
          </Components.Badge>
        </div>

        <div className="flex justify-between items-center mb-4">
          <Components.ToggleGroup
            type="single"
            defaultValue="active"
            value={filter}
            onValueChange={(value) => value && setFilter(value)}
          >
            <Components.ToggleGroupItem
              value="active"
              aria-label="Active Jobs"
              className={`${
                filter === "active"
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : ""
              }`}
            >
              <Bell size={16} className="mr-2" />
              Active
            </Components.ToggleGroupItem>
            <Components.ToggleGroupItem
              value="recent"
              aria-label="Recent Jobs"
              className={`${
                filter === "recent"
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : ""
              }`}
            >
              <Clock size={16} className="mr-2" />
              Recent
            </Components.ToggleGroupItem>
            <Components.ToggleGroupItem
              value="all"
              aria-label="All Jobs"
              className={`${
                filter === "all"
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : ""
              }`}
            >
              <Archive size={16} className="mr-2" />
              All
            </Components.ToggleGroupItem>
          </Components.ToggleGroup>

          <div className="flex items-center gap-2">
            {filter === "all" && (
              <Components.TooltipProvider>
                <Components.Tooltip>
                  <Components.TooltipTrigger asChild>
                    <Components.Button
                      variant="outline"
                      onClick={() => setShowCompleted(!showCompleted)}
                    >
                      {showCompleted ? (
                        <Eye size={16} className="mr-2" />
                      ) : (
                        <EyeOff size={16} className="mr-2" />
                      )}
                      {showCompleted ? "Hide Completed" : "Show Completed"}
                    </Components.Button>
                  </Components.TooltipTrigger>
                  <Components.TooltipContent>
                    <p>Toggle visibility of completed jobs</p>
                  </Components.TooltipContent>
                </Components.Tooltip>
              </Components.TooltipProvider>
            )}

            <Components.TooltipProvider>
              <Components.Tooltip>
                <Components.TooltipTrigger asChild>
                  <Components.Button
                    variant="outline"
                    onClick={() => setFreezeSort(!freezeSort)}
                  >
                    {freezeSort ? (
                      <PinOff size={16} className="mr-2" />
                    ) : (
                      <Pin size={16} className="mr-2" />
                    )}
                    {freezeSort ? "Unfreeze" : "Freeze"}
                  </Components.Button>
                </Components.TooltipTrigger>
                <Components.TooltipContent>
                  <p>Freeze the current job list to prevent updates</p>
                </Components.TooltipContent>
              </Components.Tooltip>
            </Components.TooltipProvider>

            <Components.TooltipProvider>
              <Components.Tooltip>
                <Components.TooltipTrigger asChild>
                  <Components.Button
                    variant="outline"
                    onClick={() => refetch()}
                  >
                    <RefreshCw size={16} />
                  </Components.Button>
                </Components.TooltipTrigger>
                <Components.TooltipContent>
                  <p>Refresh Jobs</p>
                </Components.TooltipContent>
              </Components.Tooltip>
            </Components.TooltipProvider>

            <Components.TooltipProvider>
              <Components.Tooltip>
                <Components.TooltipTrigger asChild>
                  <Components.Button
                    variant="destructive"
                    onClick={handleClearAllJobs}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Clear All
                  </Components.Button>
                </Components.TooltipTrigger>
                <Components.TooltipContent>
                  <p>Permanently delete all jobs</p>
                </Components.TooltipContent>
              </Components.Tooltip>
            </Components.TooltipProvider>
          </div>
        </div>
      </Components.Card>

      <div>
        {Object.keys(groupedJobs).length > 0 ? (
          Object.entries(groupedJobs).map(([plugin, jobs]) => (
            <PluginSection
              key={plugin}
              plugin={plugin}
              jobs={jobs}
              expandedJobs={expandedJobs}
              onToggleJobExpand={toggleJobExpansion}
              isCollapsed={collapsedPlugins[plugin]}
              onToggleCollapse={() => togglePluginCollapse(plugin)}
            />
          ))
        ) : (
          <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
            <h3 className="text-2xl font-bold mb-2">No jobs found</h3>
            <p>There are no jobs matching the current filter.</p>
          </div>
        )}
      </div>

      <Components.Dialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
      >
        <Components.DialogContent>
          <Components.DialogHeader>
            <Components.DialogTitle>Are you sure?</Components.DialogTitle>
            <Components.DialogDescription>
              This will permanently delete all jobs. This action cannot be
              undone.
            </Components.DialogDescription>
          </Components.DialogHeader>
          <Components.DialogFooter>
            <Components.Button
              variant="outline"
              onClick={handleCancelClearJobs}
            >
              Cancel
            </Components.Button>
            <Components.Button
              variant="destructive"
              onClick={handleConfirmClearJobs}
            >
              Confirm Delete
            </Components.Button>
          </Components.DialogFooter>
        </Components.DialogContent>
      </Components.Dialog>
    </div>
  );
};

registerComponent("Jobs", JobsPage);
export default JobsPage;
