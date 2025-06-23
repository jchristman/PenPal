import React, { useState, useEffect } from "react";
import { useQuery, useSubscription } from "@apollo/client";
import { Badge, CircularProgress, Box } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { registerComponent } from "@penpal/core";
import {
  JobStatus,
  COMPLETED_STATUSES,
  ACTIVE_STATUSES,
} from "../../common/job-constants.js";

import GetActiveJobs from "../pages/jobs/queries/get-active-jobs.js";
import ActiveJobsSubscription from "../pages/jobs/queries/active-jobs-subscription.js";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  badge: {
    "& .MuiBadge-badge": {
      backgroundColor: "#e74c3c",
      color: "white",
      fontSize: 11,
      height: 18,
      minWidth: 18,
      padding: "0 4px",
    },
  },
  spinner: {
    color: "#3498db",
    width: "16px !important",
    height: "16px !important",
  },
  jobText: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginLeft: 4,
  },
}));

const JobsCounter = ({ compact = false }) => {
  const classes = useStyles();
  const [activeJobs, setActiveJobs] = useState([]);

  // Initial query to get current active jobs
  const { data, loading, error } = useQuery(GetActiveJobs, {
    fetchPolicy: "cache-and-network",
    onCompleted: (data) => {
      if (data?.getActiveJobs) {
        setActiveJobs(data.getActiveJobs);
      }
    },
  });

  // Subscribe to real-time updates
  const { data: subscriptionData, error: subscriptionError } = useSubscription(
    ActiveJobsSubscription,
    {
      onData: ({ data }) => {
        if (data?.data?.activeJobsChanged) {
          setActiveJobs(data.data.activeJobsChanged);
        }
      },
      onError: (error) => {
        console.warn("Subscription error, falling back to polling:", error);
      },
    }
  );

  // Fallback to polling if subscription fails
  useEffect(() => {
    if (subscriptionError) {
      console.log("Setting up polling fallback due to subscription error");
      const interval = setInterval(async () => {
        // This will trigger a refetch through the query
        if (data) {
          setActiveJobs(data.getActiveJobs || []);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [subscriptionError, data]);

  if (loading && activeJobs.length === 0) {
    return (
      <Box className={classes.container}>
        <CircularProgress className={classes.spinner} />
        {!compact && <span className={classes.jobText}>Loading...</span>}
      </Box>
    );
  }

  if (error) {
    console.error("Error fetching active jobs:", error);
    return null;
  }

  // Filter active jobs to match the logic in the main jobs page
  const trulyActiveJobs = activeJobs.filter(
    (job) =>
      job.progress < 100 &&
      job.status !== JobStatus.CANCELLED &&
      job.status !== JobStatus.DONE &&
      job.status !== JobStatus.FAILED
  );

  const activeJobCount = trulyActiveJobs.length;

  // Check if any jobs are currently running (not just pending)
  const runningJobs = trulyActiveJobs.filter(
    (job) =>
      job.status === JobStatus.RUNNING ||
      job.status === JobStatus.IN_PROGRESS ||
      (job.progress > 0 && job.progress < 100)
  );
  const hasRunningJobs = runningJobs.length > 0;

  if (activeJobCount === 0) {
    return null; // Don't show anything if no active jobs
  }

  return (
    <Box className={classes.container}>
      <Badge
        badgeContent={activeJobCount}
        className={classes.badge}
        invisible={activeJobCount === 0}
      >
        {hasRunningJobs && <CircularProgress className={classes.spinner} />}
      </Badge>
      {!compact && activeJobCount > 0 && (
        <span className={classes.jobText}>{activeJobCount} active</span>
      )}
    </Box>
  );
};

registerComponent("JobsCounter", JobsCounter);

export default JobsCounter;
