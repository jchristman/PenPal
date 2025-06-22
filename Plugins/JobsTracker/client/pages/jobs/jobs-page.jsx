import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";

import GetAllJobs from "./queries/get-all-jobs.js";
import {
  formatRuntime,
  formatRelativeTime,
  isJobStale,
  formatCompletionTime,
} from "../../utils/time-utils.js";

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
  const isCancelled = jobStatus === "cancelled";

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
  const isCancelled = job.status === "cancelled";
  const isFinished =
    isComplete ||
    isCancelled ||
    job.status === "done" ||
    job.status === "failed";
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

const PluginSection = ({ plugin, jobs }) => {
  const classes = useStyles();
  const hasJobs = jobs && jobs.length > 0;

  return (
    <div className={classes.pluginSection}>
      <div className={classes.pluginHeader}>
        <h3 className={classes.pluginName}>{plugin}</h3>
        <span className={classes.pluginId}>{plugin}</span>
        {hasJobs && (
          <span className={classes.jobCount}>
            {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {hasJobs ? (
        <div className={classes.jobsList}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className={classes.noJobs}>No active jobs</div>
      )}
    </div>
  );
};

const ExpandedJobRow = ({ job, isExpanded, onToggle }) => {
  const classes = useStyles();
  const progressPercentage = Math.round(job.progress);
  const isComplete = progressPercentage >= 100;
  const isCancelled = job.status === "cancelled";
  const isFinished =
    isComplete ||
    isCancelled ||
    job.status === "done" ||
    job.status === "failed";

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
  const [hideCancelled, setHideCancelled] = useState(false);
  const pageSize = 20;

  const { loading, error, data } = useQuery(GetAllJobs, {
    variables: {
      limit: filterMode === "all" ? pageSize : 1000,
      offset: filterMode === "all" ? currentPage * pageSize : 0,
      filterMode: filterMode,
    },
    pollInterval: 500,
  });

  const toggleJobExpansion = (jobId) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const handleFilterChange = (newFilter) => {
    setFilterMode(newFilter);
    setCurrentPage(0);
    setExpandedJobs(new Set());
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

  const allJobs = data?.getAllJobs?.jobs || [];
  const totalCount = data?.getAllJobs?.totalCount || 0;
  const hasMore = data?.getAllJobs?.hasMore || false;

  // Filter out cancelled jobs if toggle is enabled
  const jobs = hideCancelled
    ? allJobs.filter((job) => job.status !== "cancelled")
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
        </div>

        <div style={{ marginBottom: 16 }}>
          {jobs.map((job) => (
            <ExpandedJobRow
              key={job.id}
              job={job}
              isExpanded={expandedJobs.has(job.id)}
              onToggle={() => toggleJobExpansion(job.id)}
            />
          ))}
          {jobs.length === 0 && (
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
  const jobsByPlugin = jobs.reduce((acc, job) => {
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

  // Calculate truly active jobs from all jobs (not filtered display jobs)
  const activeJobs = allJobs.filter(
    (job) =>
      job.progress < 100 &&
      job.status !== "cancelled" &&
      job.status !== "done" &&
      job.status !== "failed"
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
      </div>

      <div className={classes.pluginsContainer}>
        {pluginsWithJobs.map((plugin) => (
          <PluginSection
            key={plugin}
            plugin={plugin}
            jobs={jobsByPlugin[plugin]}
          />
        ))}
        {pluginsWithJobs.length === 0 && (
          <div className={classes.noJobs}>No jobs found</div>
        )}
      </div>
    </div>
  );
};

registerComponent("JobsPage", JobsPage);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default JobsPage;
