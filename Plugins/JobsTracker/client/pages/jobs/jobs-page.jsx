import React, { useState, useEffect } from "react";
import { useQuery, useSubscription, gql } from "@apollo/client";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Collapse,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import GetAllJobs from "./queries/get-all-jobs.js";
import JobsSubscription from "./queries/jobs-subscription.js";
import JobCreatedSubscription from "./queries/job-created-subscription.js";
import JobDeletedSubscription from "./queries/job-deleted-subscription.js";
import { formatRuntime, formatCompletionTime } from "../../utils/time-utils.js";
import { JobStatus } from "../../../common/job-constants.js";

const useStyles = makeStyles((theme) => ({
  jobsPage: {
    padding: 20,
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  },
  jobsPageLoading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 400,
  },
  jobsPageError: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 400,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    animation: "$spin 1s linear infinite",
    marginBottom: 16,
  },
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
  jobsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "2px solid #e1e5e9",
  },
  filterControls: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  filterButton: {
    padding: "8px 16px",
    border: "1px solid #e1e5e9",
    borderRadius: 6,
    background: "white",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.2s ease",
    "&:hover": {
      background: "#f8f9fa",
      borderColor: "#dee2e6",
    },
  },
  filterButtonActive: {
    background: "#3498db",
    color: "white",
    borderColor: "#3498db",
    "&:hover": {
      background: "#2980b9",
      borderColor: "#2980b9",
    },
  },
  toggleControl: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    border: "1px solid #e1e5e9",
    borderRadius: 6,
    background: "white",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.2s ease",
    cursor: "pointer",
    "&:hover": {
      background: "#f8f9fa",
      borderColor: "#dee2e6",
    },
  },
  toggleCheckbox: {
    width: 14,
    height: 14,
    cursor: "pointer",
  },
  jobsHeaderTitle: {
    margin: 0,
    color: "#2c3e50",
    fontSize: 28,
    fontWeight: 600,
  },
  jobsSummary: {
    display: "flex",
    alignItems: "center",
  },
  activeJobs: {
    background: "#e8f5e8",
    color: "#2d5a2d",
    padding: "8px 16px",
    borderRadius: 20,
    fontWeight: 500,
    fontSize: 14,
  },
  noActiveJobs: {
    background: "#f8f9fa",
    color: "#6c757d",
    padding: "8px 16px",
    borderRadius: 20,
    fontWeight: 500,
    fontSize: 14,
  },
  pluginsContainer: {
    display: "grid",
    gap: 20,
  },
  pluginSection: {
    background: "white",
    borderRadius: 12,
    border: "1px solid #e1e5e9",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "box-shadow 0.2s ease",
    "&:hover": {
      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
    },
  },
  pluginHeader: {
    padding: "16px 20px",
    background: "#f8f9fa",
    borderBottom: "1px solid #e1e5e9",
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    "&:hover": {
      background: "#e9ecef",
    },
  },
  pluginName: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: "#2c3e50",
  },
  pluginId: {
    fontSize: 12,
    color: "#6c757d",
    background: "#e9ecef",
    padding: "4px 8px",
    borderRadius: 6,
    fontFamily: "'Monaco', 'Menlo', monospace",
  },
  jobCount: {
    marginLeft: "auto",
    background: "#3498db",
    color: "white",
    padding: "4px 12px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
  },
  collapseIcon: {
    fontSize: 14,
    color: "#6c757d",
    marginLeft: 8,
    transition: "transform 0.2s ease",
  },
  collapseIconCollapsed: {
    transform: "rotate(-90deg)",
  },
  jobsList: {
    padding: 20,
    display: "grid",
    gap: 16,
  },
  noJobs: {
    padding: "12px 20px",
    textAlign: "center",
    color: "#6c757d",
    fontStyle: "italic",
    fontSize: 13,
  },
  jobCard: {
    background: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    border: "1px solid #e1e5e9",
  },
  jobHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobName: {
    margin: 0,
    fontSize: 14,
    fontWeight: 500,
    color: "#2c3e50",
    flex: 1,
    marginRight: 12,
    lineHeight: 1.4,
  },
  jobHeaderControls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  jobRuntime: {
    fontSize: 11,
    color: "#6c757d",
    background: "#f8f9fa",
    padding: "2px 6px",
    borderRadius: 4,
    fontFamily: "'Monaco', 'Menlo', monospace",
  },
  jobCompletionTime: {
    fontSize: 11,
    color: "#6c757d",
    background: "#e9ecef",
    padding: "2px 6px",
    borderRadius: 4,
    fontFamily: "'Monaco', 'Menlo', monospace",
  },
  paginationControls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    margin: "20px 0",
    padding: 16,
    background: "#f8f9fa",
    borderRadius: 8,
  },
  paginationButton: {
    padding: "6px 12px",
    border: "1px solid #e1e5e9",
    borderRadius: 4,
    background: "white",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    "&:hover": {
      background: "#f8f9fa",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  paginationInfo: {
    fontSize: 12,
    color: "#6c757d",
  },
  expandedJobRow: {
    background: "white",
    borderRadius: 8,
    border: "1px solid #e1e5e9",
    marginBottom: 12,
    overflow: "hidden",
  },
  expandedJobHeader: {
    padding: 12,
    background: "#f8f9fa",
    borderBottom: "1px solid #e1e5e9",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expandedJobContent: {
    padding: 16,
  },
  stagesToggle: {
    background: "#f8f9fa",
    border: "1px solid #e1e5e9",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 11,
    color: "#6c757d",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "all 0.2s ease",
    "&:hover": {
      background: "#e9ecef",
      borderColor: "#dee2e6",
    },
  },
  toggleIcon: {
    fontSize: 10,
    transition: "transform 0.2s ease",
  },
  toggleIconCollapsed: {
    transform: "rotate(-90deg)",
  },
  toggleIconExpanded: {
    transform: "rotate(0deg)",
  },
  jobStatus: {
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 8px",
    borderRadius: 6,
    minWidth: 45,
    textAlign: "center",
  },
  jobStatusRunning: {
    background: "#fff3cd",
    color: "#856404",
  },
  jobStatusComplete: {
    background: "#d4edda",
    color: "#155724",
  },
  jobStatusCancelled: {
    background: "#f8d7da",
    color: "#721c24",
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  completionLabel: {
    fontSize: 11,
    color: "#6c757d",
    background: "#e9ecef",
    padding: "2px 6px",
    borderRadius: 4,
    fontFamily: "'Monaco', 'Menlo', monospace",
  },
  progressBar: {
    width: "100%",
    height: 8,
    background: "#e9ecef",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  progressFillRunning: {
    background: "linear-gradient(90deg, #3498db, #2980b9)",
  },
  progressFillComplete: {
    background: "linear-gradient(90deg, #27ae60, #229954)",
  },
  progressFillCancelled: {
    background: "linear-gradient(90deg, #dc3545, #c82333)",
  },
  jobStatusText: {
    fontSize: 12,
    color: "#6c757d",
    lineHeight: 1.4,
  },
  stagesContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid #e9ecef",
  },
  stagesList: {
    display: "grid",
    gap: 8,
  },
  stageCard: {
    background: "#ffffff",
    border: "1px solid #e9ecef",
    borderRadius: 6,
    padding: 12,
    marginLeft: 20,
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      left: -20,
      top: "50%",
      width: 12,
      height: 1,
      background: "#dee2e6",
    },
  },
  stageHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  stageNumber: {
    background: "#6c757d",
    color: "white",
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 600,
    flexShrink: 0,
  },
  stageName: {
    margin: 0,
    fontSize: 13,
    fontWeight: 500,
    color: "#495057",
    flex: 1,
  },
  stageStatus: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 4,
    minWidth: 35,
    textAlign: "center",
  },
  stageStatusRunning: {
    background: "#fff3cd",
    color: "#856404",
  },
  stageStatusComplete: {
    background: "#d4edda",
    color: "#155724",
  },
  stageStatusActive: {
    background: "#cce5ff",
    color: "#0052cc",
    position: "relative",
    "&::after": {
      content: '"● ACTIVE"',
      fontSize: 9,
      fontWeight: 700,
      marginLeft: 4,
    },
  },
  stageStatusCancelled: {
    background: "#f8d7da",
    color: "#721c24",
  },
  stageProgressContainer: {
    marginBottom: 8,
  },
  stageProgressBar: {
    width: "100%",
    height: 6,
    background: "#f1f3f4",
    borderRadius: 3,
    overflow: "hidden",
  },
  stageProgressFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.3s ease",
  },
  stageProgressFillRunning: {
    background: "linear-gradient(90deg, #17a2b8, #138496)",
  },
  stageProgressFillComplete: {
    background: "linear-gradient(90deg, #28a745, #218838)",
  },
  stageProgressFillActive: {
    background: "linear-gradient(90deg, #007acc, #0066b3)",
  },
  stageProgressFillCancelled: {
    background: "linear-gradient(90deg, #dc3545, #c82333)",
  },
  stageCardActive: {
    background: "#f8fcff",
    border: "2px solid #007acc",
    boxShadow: "0 2px 8px rgba(0, 122, 204, 0.15)",
  },
  stageStatusText: {
    fontSize: 11,
    color: "#868e96",
    lineHeight: 1.3,
  },
  activeStageIndicator: {
    fontSize: 12,
    color: "#007acc",
    fontWeight: 600,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
    "&::before": {
      content: '"▶"',
      fontSize: 10,
    },
  },
  // Mobile responsive styles
  [theme.breakpoints.down("md")]: {
    jobsPage: {
      padding: 16,
    },
    jobsHeader: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 12,
    },
    pluginHeader: {
      flexWrap: "wrap",
    },
    jobHeader: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 8,
    },
    jobHeaderControls: {
      width: "100%",
      justifyContent: "space-between",
    },
    stageCard: {
      marginLeft: 10,
      "&::before": {
        left: -10,
        width: 6,
      },
    },
  },
}));

// Helper function to determine which stage is currently active
const findActiveStageIndex = (stages) => {
  if (!stages || stages.length === 0) return -1;

  // Find the first stage that's not complete (progress < 100) but has some progress (progress > 0)
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const progress = Math.round(stage.progress);

    if (progress > 0 && progress < 100) {
      return i;
    }
  }

  // If no stage is actively in progress, find the first stage that hasn't started yet
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const progress = Math.round(stage.progress);

    if (progress === 0) {
      return i;
    }
  }

  // If all stages are complete, no stage is active
  return -1;
};

const StageCard = ({ stage, index, isActive, jobStatus }) => {
  const classes = useStyles();
  const progressPercentage = Math.round(stage.progress);
  const isComplete = progressPercentage >= 100;
  const isCancelled = jobStatus === JobStatus.CANCELLED;

  // Determine the status style based on completion and active state
  const getStatusClass = () => {
    if (isCancelled) return classes.stageStatusCancelled;
    if (isComplete) return classes.stageStatusComplete;
    if (isActive && !isCancelled) return classes.stageStatusActive;
    return classes.stageStatusRunning;
  };

  // Determine the progress fill style
  const getProgressFillClass = () => {
    if (isCancelled) return classes.stageProgressFillCancelled;
    if (isComplete) return classes.stageProgressFillComplete;
    if (isActive && !isCancelled) return classes.stageProgressFillActive;
    return classes.stageProgressFillRunning;
  };

  return (
    <div
      className={`${classes.stageCard} ${
        isActive ? classes.stageCardActive : ""
      }`}
    >
      {isActive && !isCancelled && (
        <div className={classes.activeStageIndicator}>
          Currently Active Stage
        </div>
      )}

      <div className={classes.stageHeader}>
        <span className={classes.stageNumber}>{index + 1}</span>
        <h5 className={classes.stageName}>{stage.name}</h5>
        <span className={`${classes.stageStatus} ${getStatusClass()}`}>
          {progressPercentage}%
        </span>
      </div>

      <div className={classes.stageProgressContainer}>
        <div className={classes.stageProgressBar}>
          <div
            className={`${classes.stageProgressFill} ${getProgressFillClass()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className={classes.stageStatusText}>{stage.statusText}</div>
    </div>
  );
};

const JobCard = ({ job }) => {
  const classes = useStyles();
  const [stagesCollapsed, setStagesCollapsed] = useState(false);
  const progressPercentage = Math.round(job.progress);
  const isComplete = progressPercentage >= 100;
  const isCancelled = job.status === JobStatus.CANCELLED;
  const isFinished =
    isComplete ||
    isCancelled ||
    job.status === JobStatus.DONE ||
    job.status === JobStatus.FAILED;
  const hasStages = job.stages && job.stages.length > 0;

  // Determine which stage is currently active (only if job is not cancelled)
  const activeStageIndex =
    hasStages && !isCancelled ? findActiveStageIndex(job.stages) : -1;
  const activeStage =
    activeStageIndex >= 0 ? job.stages[activeStageIndex] : null;

  return (
    <div className={classes.jobCard}>
      <div className={classes.jobHeader}>
        <h4 className={classes.jobName}>{job.name}</h4>
        <div className={classes.jobHeaderControls}>
          <span
            className={classes.jobRuntime}
            title={`Started: ${new Date(
              job.created_at
            ).toLocaleString()}\nLast updated: ${new Date(
              job.updated_at
            ).toLocaleString()}`}
          >
            {formatRuntime(job.created_at, job.updated_at)}
          </span>
          {hasStages && (
            <button
              className={classes.stagesToggle}
              onClick={() => setStagesCollapsed(!stagesCollapsed)}
              title={stagesCollapsed ? "Show stages" : "Hide stages"}
            >
              <span
                className={`${classes.toggleIcon} ${
                  stagesCollapsed
                    ? classes.toggleIconCollapsed
                    : classes.toggleIconExpanded
                }`}
              >
                ▼
              </span>
              {job.stages.length} stage{job.stages.length !== 1 ? "s" : ""}
            </button>
          )}
          <span
            className={`${classes.jobStatus} ${
              isCancelled
                ? classes.jobStatusCancelled
                : isComplete
                ? classes.jobStatusComplete
                : classes.jobStatusRunning
            }`}
          >
            {progressPercentage}%
          </span>
        </div>
      </div>

      <div className={classes.progressContainer}>
        <div className={classes.progressBar}>
          <div
            className={`${classes.progressFill} ${
              isCancelled
                ? classes.progressFillCancelled
                : isComplete
                ? classes.progressFillComplete
                : classes.progressFillRunning
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className={classes.progressFooter}>
          <div className={classes.jobStatusText}>
            {job.statusText}
            {activeStage && !isComplete && !isCancelled && (
              <div style={{ marginTop: 4, fontWeight: 500, color: "#007acc" }}>
                Currently running: {activeStage.name}
              </div>
            )}
          </div>
          {isFinished && (
            <span
              className={classes.completionLabel}
              title={`${isCancelled ? "Cancelled" : "Completed"}: ${new Date(
                job.updated_at
              ).toLocaleString()}`}
            >
              {isCancelled ? "Cancelled at" : "Completed at"}{" "}
              {formatCompletionTime(job.updated_at)}
            </span>
          )}
        </div>
      </div>

      {hasStages && !stagesCollapsed && (
        <div className={classes.stagesContainer}>
          <div className={classes.stagesList}>
            {job.stages.map((stage, index) => (
              <StageCard
                key={stage.id}
                stage={stage}
                index={index}
                isActive={index === activeStageIndex}
                jobStatus={job.status}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PluginSection = ({ plugin, jobs, isCollapsed, onToggleCollapse }) => {
  const classes = useStyles();
  const hasJobs = jobs && jobs.length > 0;

  return (
    <div className={classes.pluginSection}>
      <div
        className={classes.pluginHeader}
        onClick={() => onToggleCollapse(plugin)}
      >
        <h3 className={classes.pluginName}>{plugin}</h3>
        <span className={classes.pluginId}>{plugin}</span>
        {hasJobs && (
          <span className={classes.jobCount}>
            {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          </span>
        )}
        <span
          className={`${classes.collapseIcon} ${
            isCollapsed ? classes.collapseIconCollapsed : ""
          }`}
        >
          ▼
        </span>
      </div>

      {!isCollapsed &&
        (hasJobs ? (
          <div className={classes.jobsList}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className={classes.noJobs}>No active jobs</div>
        ))}
    </div>
  );
};

const ExpandedJobRow = ({ job, isExpanded, onToggle }) => {
  const classes = useStyles();
  const progressPercentage = Math.round(job.progress);
  const isComplete = progressPercentage >= 100;
  const isCancelled = job.status === JobStatus.CANCELLED;
  const isFinished =
    isComplete ||
    isCancelled ||
    job.status === JobStatus.DONE ||
    job.status === JobStatus.FAILED;

  return (
    <div className={classes.expandedJobRow}>
      <div className={classes.expandedJobHeader} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#6c757d" }}>{job.plugin}</span>
          <span style={{ fontWeight: 500 }}>{job.name}</span>
          <span className={classes.jobRuntime}>
            {formatRuntime(job.created_at, job.updated_at)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#6c757d" }}>
            {Math.round(job.progress)}%
          </span>
          <span style={{ fontSize: 12 }}>{isExpanded ? "▼" : "▶"}</span>
        </div>
      </div>
      {isExpanded && (
        <div className={classes.expandedJobContent}>
          <JobCard job={job} />
        </div>
      )}
    </div>
  );
};

const JobsPage = () => {
  const classes = useStyles();
  const [filterMode, setFilterMode] = useState("active");
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedJobs, setExpandedJobs] = useState(new Set());
  const [collapsedPlugins, setCollapsedPlugins] = useState(new Set());
  const [hideCancelled, setHideCancelled] = useState(false);
  const [freezeSort, setFreezeSort] = useState(false);
  const [frozenPluginOrder, setFrozenPluginOrder] = useState([]);
  const [lastStableOrder, setLastStableOrder] = useState([]);
  const [jobs, setJobs] = useState([]);
  const pageSize = 20;

  // Stability threshold: only reorder if time difference is > 30 seconds
  const STABILITY_THRESHOLD_MS = 30 * 1000; // 30 seconds

  // Initial query to load data
  const { loading, error, data, refetch } = useQuery(GetAllJobs, {
    variables: {
      limit: filterMode === "all" ? pageSize : 1000,
      offset: filterMode === "all" ? currentPage * pageSize : 0,
      filterMode: filterMode,
    },
    notifyOnNetworkStatusChange: true,
  });

  // Subscription for job updates
  const { data: updateSubscriptionData } = useSubscription(JobsSubscription, {
    onData: ({ data }) => {
      if (data?.data?.jobUpdated) {
        const updatedJob = data.data.jobUpdated;

        setJobs((prev) => {
          const jobIndex = prev.findIndex((job) => job.id === updatedJob.id);
          if (jobIndex >= 0) {
            // Update existing job
            const updated = [...prev];
            updated[jobIndex] = updatedJob;
            return updated;
          } else {
            // Add new job if it doesn't exist
            return [updatedJob, ...prev];
          }
        });
      }
    },
    onError: (error) => {
      console.warn("Jobs update subscription error:", error);
    },
  });

  // Subscription for job creation
  const { data: createSubscriptionData } = useSubscription(
    JobCreatedSubscription,
    {
      onData: ({ data }) => {
        if (data?.data?.jobCreated) {
          const newJob = data.data.jobCreated;

          setJobs((prev) => {
            // Check if job already exists to avoid duplicates
            const exists = prev.some((job) => job.id === newJob.id);
            if (!exists) {
              return [newJob, ...prev];
            }
            return prev;
          });
        }
      },
      onError: (error) => {
        console.warn("Jobs creation subscription error:", error);
      },
    }
  );

  // Subscription for job deletion
  const { data: deleteSubscriptionData } = useSubscription(
    JobDeletedSubscription,
    {
      onData: ({ data }) => {
        if (data?.data?.jobDeleted) {
          const deletedJobId = data.data.jobDeleted;

          setJobs((prev) => prev.filter((job) => job.id !== deletedJobId));
        }
      },
      onError: (error) => {
        console.warn("Jobs deletion subscription error:", error);
      },
    }
  );

  // Update local jobs state when query data changes
  useEffect(() => {
    if (data?.getAllJobs?.jobs) {
      setJobs(data.getAllJobs.jobs);
    }
  }, [data]);

  // Refetch when filter mode or pagination changes
  useEffect(() => {
    refetch({
      limit: filterMode === "all" ? pageSize : 1000,
      offset: filterMode === "all" ? currentPage * pageSize : 0,
      filterMode: filterMode,
    });
  }, [filterMode, currentPage, refetch]);

  // Update stable order when needed (moved to top to follow Rules of Hooks)
  useEffect(() => {
    if (!freezeSort && jobs.length > 0) {
      const filteredJobs = hideCancelled
        ? jobs.filter((job) => job.status !== JobStatus.CANCELLED)
        : jobs;

      const jobsByPlugin = filteredJobs.reduce((acc, job) => {
        const plugin = job.plugin || "Unknown";
        if (!acc[plugin]) {
          acc[plugin] = [];
        }
        acc[plugin].push(job);
        return acc;
      }, {});

      const pluginsWithJobs = Object.keys(jobsByPlugin).filter(
        (plugin) => jobsByPlugin[plugin].length > 0
      );

      if (pluginsWithJobs.length === 0) return;

      // Calculate plugin timestamps for sorting
      const pluginTimestamps = {};
      pluginsWithJobs.forEach((plugin) => {
        const jobs = jobsByPlugin[plugin];
        pluginTimestamps[plugin] = Math.max(
          ...jobs.map((job) => new Date(job.created_at).getTime())
        );
      });

      // Determine if we need to reorder
      let needsReorder = false;
      let needsReorderForNewPlugins = false;

      if (lastStableOrder.length > 0) {
        // Check if we need to reorder based on stability threshold
        needsReorder = lastStableOrder.some((plugin, index) => {
          const nextPlugin = lastStableOrder[index + 1];
          if (
            !nextPlugin ||
            !pluginTimestamps[plugin] ||
            !pluginTimestamps[nextPlugin]
          ) {
            return false;
          }

          // If a lower-ranked plugin is now significantly newer, reorder
          const timeDiff =
            pluginTimestamps[nextPlugin] - pluginTimestamps[plugin];
          return timeDiff > STABILITY_THRESHOLD_MS;
        });

        // Also check for new plugins that are significantly newer than the top plugin
        const newPlugins = pluginsWithJobs.filter(
          (plugin) => !lastStableOrder.includes(plugin)
        );
        needsReorderForNewPlugins = newPlugins.some((newPlugin) => {
          const topPlugin = lastStableOrder[0];
          if (!topPlugin || !pluginTimestamps[topPlugin]) return true;

          const timeDiff =
            pluginTimestamps[newPlugin] - pluginTimestamps[topPlugin];
          return timeDiff > STABILITY_THRESHOLD_MS;
        });
      }

      // Update stable order when needed
      if (
        needsReorder ||
        needsReorderForNewPlugins ||
        lastStableOrder.length === 0
      ) {
        const newOrder = pluginsWithJobs.sort((pluginA, pluginB) => {
          return pluginTimestamps[pluginB] - pluginTimestamps[pluginA];
        });
        setLastStableOrder(newOrder);
      }
    }
  }, [
    jobs,
    hideCancelled,
    freezeSort,
    lastStableOrder,
    STABILITY_THRESHOLD_MS,
  ]);

  const toggleJobExpansion = (jobId) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const togglePluginCollapse = (pluginName) => {
    const newCollapsed = new Set(collapsedPlugins);
    if (newCollapsed.has(pluginName)) {
      newCollapsed.delete(pluginName);
    } else {
      newCollapsed.add(pluginName);
    }
    setCollapsedPlugins(newCollapsed);
  };

  const handleFilterChange = (newFilter) => {
    setFilterMode(newFilter);
    setCurrentPage(0);
    setExpandedJobs(new Set());
    // Reset freeze and stable order when changing filters
    setFreezeSort(false);
    setFrozenPluginOrder([]);
    setLastStableOrder([]);
  };

  const toggleFreezeSort = () => {
    if (!freezeSort) {
      // About to freeze - save current plugin order
      const filteredJobs = hideCancelled
        ? jobs.filter((job) => job.status !== JobStatus.CANCELLED)
        : jobs;

      const jobsByPlugin = filteredJobs.reduce((acc, job) => {
        const plugin = job.plugin || "Unknown";
        if (!acc[plugin]) {
          acc[plugin] = [];
        }
        acc[plugin].push(job);
        return acc;
      }, {});

      const pluginsWithJobs = Object.keys(jobsByPlugin).filter(
        (plugin) => jobsByPlugin[plugin].length > 0
      );

      // Sort plugins by most recent job creation time to capture current order
      const currentSortedPlugins = pluginsWithJobs.sort((pluginA, pluginB) => {
        const jobsA = jobsByPlugin[pluginA];
        const jobsB = jobsByPlugin[pluginB];

        const mostRecentA = Math.max(
          ...jobsA.map((job) => new Date(job.created_at).getTime())
        );
        const mostRecentB = Math.max(
          ...jobsB.map((job) => new Date(job.created_at).getTime())
        );

        return mostRecentB - mostRecentA;
      });

      setFrozenPluginOrder(currentSortedPlugins);
    }

    setFreezeSort(!freezeSort);
  };

  if (loading) {
    return (
      <div className={classes.jobsPageLoading}>
        <div className={classes.loadingSpinner}></div>
        <p>Loading jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.jobsPageError}>
        <h3>Error loading jobs</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  const allJobs = jobs; // Using state instead of query data
  const totalCount = data?.getAllJobs?.totalCount || 0;
  const hasMore = data?.getAllJobs?.hasMore || false;

  // Filter out cancelled jobs if toggle is enabled
  const filteredJobs = hideCancelled
    ? allJobs.filter((job) => job.status !== JobStatus.CANCELLED)
    : allJobs;

  // For "all" mode, show paginated table
  if (filterMode === "all") {
    const totalPages = Math.ceil(totalCount / pageSize);
    const canGoNext = hasMore;
    const canGoPrev = currentPage > 0;

    return (
      <div className={classes.jobsPage}>
        <div className={classes.jobsHeader}>
          <h2 className={classes.jobsHeaderTitle}>Plugin Jobs</h2>
          <div className={classes.jobsSummary}>
            <span className={classes.noActiveJobs}>
              {totalCount} total job{totalCount !== 1 ? "s" : ""}
            </span>
            {freezeSort && (
              <span
                style={{
                  marginLeft: 12,
                  background: "#e3f2fd",
                  color: "#1565c0",
                  padding: "6px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                🧊 Sort frozen
              </span>
            )}
          </div>
        </div>

        <div className={classes.filterControls}>
          <button
            className={`${classes.filterButton} ${
              filterMode === "active" ? classes.filterButtonActive : ""
            }`}
            onClick={() => handleFilterChange("active")}
          >
            Show Active Jobs
          </button>
          <button
            className={`${classes.filterButton} ${
              filterMode === "recent" ? classes.filterButtonActive : ""
            }`}
            onClick={() => handleFilterChange("recent")}
          >
            Show Recent Jobs (24h)
          </button>
          <button
            className={`${classes.filterButton} ${
              filterMode === "all" ? classes.filterButtonActive : ""
            }`}
            onClick={() => handleFilterChange("all")}
          >
            Show All Jobs
          </button>
          <label className={classes.toggleControl}>
            <input
              type="checkbox"
              className={classes.toggleCheckbox}
              checked={hideCancelled}
              onChange={(e) => setHideCancelled(e.target.checked)}
            />
            Hide Cancelled Jobs
          </label>
          <button
            className={`${classes.filterButton} ${
              freezeSort ? classes.filterButtonActive : ""
            }`}
            onClick={toggleFreezeSort}
            title={
              freezeSort ? "Resume live updates" : "Freeze sorting and updates"
            }
          >
            {freezeSort ? "🧊 Sort Frozen" : "❄️ Freeze Sort"}
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          {filteredJobs.map((job) => (
            <ExpandedJobRow
              key={job.id}
              job={job}
              isExpanded={expandedJobs.has(job.id)}
              onToggle={() => toggleJobExpansion(job.id)}
            />
          ))}
          {filteredJobs.length === 0 && (
            <div className={classes.noJobs}>No jobs found</div>
          )}
        </div>

        {totalCount > pageSize && (
          <div className={classes.paginationControls}>
            <button
              className={classes.paginationButton}
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!canGoPrev}
            >
              Previous
            </button>
            <span className={classes.paginationInfo}>
              Page {currentPage + 1} of {totalPages} ({totalCount} total jobs)
            </span>
            <button
              className={classes.paginationButton}
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!canGoNext}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  // For "active" and "recent" modes, show grouped by plugin
  const jobsByPlugin = filteredJobs.reduce((acc, job) => {
    const plugin = job.plugin || "Unknown";
    if (!acc[plugin]) {
      acc[plugin] = [];
    }
    acc[plugin].push(job);
    return acc;
  }, {});

  const pluginsWithJobs = Object.keys(jobsByPlugin).filter(
    (plugin) => jobsByPlugin[plugin].length > 0
  );

  // Sort plugins by most recent job creation time (unless frozen)
  const sortedPlugins = freezeSort
    ? frozenPluginOrder
        .filter((plugin) => pluginsWithJobs.includes(plugin))
        .concat(
          pluginsWithJobs.filter(
            (plugin) => !frozenPluginOrder.includes(plugin)
          )
        )
    : lastStableOrder.length > 0
    ? // Use stable order + any new plugins at the end
      lastStableOrder
        .filter((plugin) => pluginsWithJobs.includes(plugin))
        .concat(
          pluginsWithJobs.filter((plugin) => !lastStableOrder.includes(plugin))
        )
    : // Fallback to simple sort if no stable order exists yet
      pluginsWithJobs.sort((pluginA, pluginB) => {
        const jobsA = jobsByPlugin[pluginA];
        const jobsB = jobsByPlugin[pluginB];
        const timestampA = Math.max(
          ...jobsA.map((job) => new Date(job.created_at).getTime())
        );
        const timestampB = Math.max(
          ...jobsB.map((job) => new Date(job.created_at).getTime())
        );
        return timestampB - timestampA;
      });

  // Calculate truly active jobs from all jobs (not filtered display jobs)
  const activeJobs = allJobs.filter(
    (job) =>
      job.progress < 100 &&
      job.status !== JobStatus.CANCELLED &&
      job.status !== JobStatus.DONE &&
      job.status !== JobStatus.FAILED
  );

  return (
    <div className={classes.jobsPage}>
      <div className={classes.jobsHeader}>
        <h2 className={classes.jobsHeaderTitle}>Plugin Jobs</h2>
        <div className={classes.jobsSummary}>
          {activeJobs.length > 0 ? (
            <span className={classes.activeJobs}>
              {activeJobs.length} active job{activeJobs.length !== 1 ? "s" : ""}{" "}
              running
            </span>
          ) : (
            <span className={classes.noActiveJobs}>No active jobs</span>
          )}
          {freezeSort && (
            <span
              style={{
                marginLeft: 12,
                background: "#e3f2fd",
                color: "#1565c0",
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              🧊 Sort frozen
            </span>
          )}
          {!freezeSort && lastStableOrder.length > 0 && (
            <span
              style={{
                marginLeft: 12,
                background: "#f1f8e9",
                color: "#33691e",
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
              }}
              title="Plugins sorted with 30s stability threshold to prevent constant reshuffling"
            >
              📌 Stable sort
            </span>
          )}
        </div>
      </div>

      <div className={classes.filterControls}>
        <button
          className={`${classes.filterButton} ${
            filterMode === "active" ? classes.filterButtonActive : ""
          }`}
          onClick={() => handleFilterChange("active")}
        >
          Show Active Jobs
        </button>
        <button
          className={`${classes.filterButton} ${
            filterMode === "recent" ? classes.filterButtonActive : ""
          }`}
          onClick={() => handleFilterChange("recent")}
        >
          Show Recent Jobs (24h)
        </button>
        <button
          className={`${classes.filterButton} ${
            filterMode === "all" ? classes.filterButtonActive : ""
          }`}
          onClick={() => handleFilterChange("all")}
        >
          Show All Jobs
        </button>
        <label className={classes.toggleControl}>
          <input
            type="checkbox"
            className={classes.toggleCheckbox}
            checked={hideCancelled}
            onChange={(e) => setHideCancelled(e.target.checked)}
          />
          Hide Cancelled Jobs
        </label>
        <button
          className={`${classes.filterButton} ${
            freezeSort ? classes.filterButtonActive : ""
          }`}
          onClick={toggleFreezeSort}
          title={
            freezeSort ? "Resume live updates" : "Freeze sorting and updates"
          }
        >
          {freezeSort ? "🧊 Sort Frozen" : "❄️ Freeze Sort"}
        </button>
      </div>

      <div className={classes.pluginsContainer}>
        {sortedPlugins.map((plugin) => (
          <PluginSection
            key={plugin}
            plugin={plugin}
            jobs={jobsByPlugin[plugin]}
            isCollapsed={collapsedPlugins.has(plugin)}
            onToggleCollapse={togglePluginCollapse}
          />
        ))}
        {sortedPlugins.length === 0 && (
          <div className={classes.noJobs}>No jobs found</div>
        )}
      </div>
    </div>
  );
};

registerComponent("JobsPage", JobsPage);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default JobsPage;
