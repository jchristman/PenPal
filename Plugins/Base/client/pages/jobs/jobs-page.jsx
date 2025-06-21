import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";

import GetPluginJobs from "./queries/get-all-jobs.js";

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
  progressContainer: {
    marginBottom: 12,
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

const StageCard = ({ stage, index, isActive }) => {
  const classes = useStyles();
  const progressPercentage = Math.round(stage.progress);
  const isComplete = progressPercentage >= 100;

  // Determine the status style based on completion and active state
  const getStatusClass = () => {
    if (isComplete) return classes.stageStatusComplete;
    if (isActive) return classes.stageStatusActive;
    return classes.stageStatusRunning;
  };

  // Determine the progress fill style
  const getProgressFillClass = () => {
    if (isComplete) return classes.stageProgressFillComplete;
    if (isActive) return classes.stageProgressFillActive;
    return classes.stageProgressFillRunning;
  };

  return (
    <div
      className={`${classes.stageCard} ${
        isActive ? classes.stageCardActive : ""
      }`}
    >
      {isActive && (
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
  const hasStages = job.stages && job.stages.length > 0;

  // Determine which stage is currently active
  const activeStageIndex = hasStages ? findActiveStageIndex(job.stages) : -1;
  const activeStage =
    activeStageIndex >= 0 ? job.stages[activeStageIndex] : null;

  return (
    <div className={classes.jobCard}>
      <div className={classes.jobHeader}>
        <h4 className={classes.jobName}>{job.name}</h4>
        <div className={classes.jobHeaderControls}>
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
              isComplete ? classes.jobStatusComplete : classes.jobStatusRunning
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
              isComplete
                ? classes.progressFillComplete
                : classes.progressFillRunning
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className={classes.jobStatusText}>
        {job.statusText}
        {activeStage && !isComplete && (
          <div style={{ marginTop: 8, fontWeight: 500, color: "#007acc" }}>
            Currently running: {activeStage.name}
          </div>
        )}
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PluginSection = ({ plugin }) => {
  const classes = useStyles();
  const hasJobs = plugin.jobs && plugin.jobs.length > 0;

  return (
    <div className={classes.pluginSection}>
      <div className={classes.pluginHeader}>
        <h3 className={classes.pluginName}>{plugin.name}</h3>
        <span className={classes.pluginId}>{plugin.id}</span>
        {hasJobs && (
          <span className={classes.jobCount}>
            {plugin.jobs.length} job{plugin.jobs.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {hasJobs ? (
        <div className={classes.jobsList}>
          {plugin.jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className={classes.noJobs}>No active jobs</div>
      )}
    </div>
  );
};

const JobsPage = () => {
  const classes = useStyles();
  const { loading, error, data } = useQuery(GetPluginJobs, {
    pollInterval: 500,
  });

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

  const plugins = data?.getPlugins || [];
  const pluginsWithJobs = plugins.filter(
    (plugin) => plugin.jobs && plugin.jobs.length > 0
  );
  const pluginsWithoutJobs = plugins.filter(
    (plugin) => !plugin.jobs || plugin.jobs.length === 0
  );
  const totalJobs = pluginsWithJobs.reduce(
    (sum, plugin) => sum + plugin.jobs.length,
    0
  );

  // Sort plugins so those with jobs appear first
  const sortedPlugins = [...pluginsWithJobs, ...pluginsWithoutJobs];

  return (
    <div className={classes.jobsPage}>
      <div className={classes.jobsHeader}>
        <h2 className={classes.jobsHeaderTitle}>Plugin Jobs</h2>
        <div className={classes.jobsSummary}>
          {totalJobs > 0 ? (
            <span className={classes.activeJobs}>
              {totalJobs} active job{totalJobs !== 1 ? "s" : ""} running
            </span>
          ) : (
            <span className={classes.noActiveJobs}>No active jobs</span>
          )}
        </div>
      </div>

      <div className={classes.pluginsContainer}>
        {sortedPlugins.map((plugin) => (
          <PluginSection key={plugin.id} plugin={plugin} />
        ))}
      </div>
    </div>
  );
};

registerComponent("JobsPage", JobsPage);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default JobsPage;
