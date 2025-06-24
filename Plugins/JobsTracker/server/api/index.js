import PenPal from "#penpal/core";
import {
  JobStatus,
  COMPLETED_STATUSES,
  ACTIVE_STATUSES,
} from "../../common/job-constants.js";

// Import the shared logger from plugin.js
import { JobsTrackerLogger as logger } from "../plugin.js";

// Helper function to ensure job data meets GraphQL schema requirements
const sanitizeJobForPubSub = (job) => {
  if (!job) {
    logger.warn("Attempted to sanitize null/undefined job for PubSub");
    return null;
  }

  const sanitized = {
    ...job,
    // Ensure required non-nullable fields have values
    name: job.name || "Unnamed Job",
    plugin: job.plugin || "Unknown",
    statusText: job.statusText || "",
    progress: typeof job.progress === "number" ? job.progress : 0,
    status: job.status || JobStatus.PENDING,
    created_at: job.created_at || new Date().toISOString(),
    updated_at: job.updated_at || new Date().toISOString(),
  };

  // Sanitize stages if they exist
  if (sanitized.stages && Array.isArray(sanitized.stages)) {
    sanitized.stages = sanitized.stages.map((stage) => ({
      ...stage,
      name: stage.name || "Unnamed Stage",
      plugin: stage.plugin || sanitized.plugin || "Unknown",
      statusText: stage.statusText || "",
      progress: typeof stage.progress === "number" ? stage.progress : 0,
      status: stage.status || JobStatus.PENDING,
    }));
  }

  return sanitized;
};

// Job CRUD operations
export const getJob = async (job_id) => {
  return await PenPal.DataStore.fetchOne("JobsTracker", "Jobs", { id: job_id });
};

export const getJobs = async (job_ids) => {
  if (job_ids === undefined) {
    return await PenPal.DataStore.fetch("JobsTracker", "Jobs", {});
  }
  return await PenPal.DataStore.fetch("JobsTracker", "Jobs", {
    id: { $in: job_ids },
  });
};

export const getJobsByPlugin = async (plugin_name) => {
  return await PenPal.DataStore.fetch("JobsTracker", "Jobs", {
    plugin: plugin_name,
  });
};

export const insertJob = async (job) => {
  // Validate required fields before inserting
  if (!job.name || job.name.trim() === "") {
    logger.warn("Job creation attempted without name, using default:", job);
  }
  if (!job.plugin || job.plugin.trim() === "") {
    logger.warn("Job creation attempted without plugin, using default:", job);
  }
  if (typeof job.statusText !== "string") {
    logger.warn(
      "Job creation attempted without statusText, using default:",
      job
    );
  }

  const job_with_defaults = {
    // Apply defaults first
    name: "Unnamed Job",
    plugin: "Unknown",
    statusText: "",
    progress: 0,
    status: JobStatus.PENDING,
    // Then override with provided values
    ...job,
    // Always set timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Ensure required fields are not empty strings
  if (job_with_defaults.name.trim() === "") {
    job_with_defaults.name = "Unnamed Job";
  }
  if (job_with_defaults.plugin.trim() === "") {
    job_with_defaults.plugin = "Unknown";
  }

  const result = await PenPal.DataStore.insertMany("JobsTracker", "Jobs", [
    job_with_defaults,
  ]);

  const createdJob = result[0];

  // Publish job creation event with sanitized data
  if (PenPal.PubSub) {
    const sanitizedJob = sanitizeJobForPubSub(createdJob);
    if (sanitizedJob) {
      PenPal.PubSub.publish("JOB_CREATED", { jobCreated: sanitizedJob });

      // Also publish active jobs change
      const activeJobs = await getActiveJobs();
      const sanitizedActiveJobs = activeJobs
        .map((job) => sanitizeJobForPubSub(job))
        .filter(Boolean);
      PenPal.PubSub.publish("ACTIVE_JOBS_CHANGED", {
        activeJobsChanged: sanitizedActiveJobs,
      });
    } else {
      logger.error("Failed to sanitize created job for PubSub:", createdJob);
    }
  }

  return createdJob; // Return the first (and only) inserted job
};

export const insertJobs = async (jobs) => {
  const jobs_with_timestamps = jobs.map((job) => ({
    ...job,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return await PenPal.DataStore.insertMany(
    "JobsTracker",
    "Jobs",
    jobs_with_timestamps
  );
};

export const updateJob = async (job_id, updates) => {
  // Validate updates to prevent null values for required fields
  const sanitized_updates = { ...updates };

  if ("name" in updates && (!updates.name || updates.name.trim() === "")) {
    logger.warn(
      `Job ${job_id} update attempted with invalid name, removing from update:`,
      updates.name
    );
    delete sanitized_updates.name;
  }

  if (
    "plugin" in updates &&
    (!updates.plugin || updates.plugin.trim() === "")
  ) {
    logger.warn(
      `Job ${job_id} update attempted with invalid plugin, removing from update:`,
      updates.plugin
    );
    delete sanitized_updates.plugin;
  }

  if ("statusText" in updates && typeof updates.statusText !== "string") {
    logger.warn(
      `Job ${job_id} update attempted with invalid statusText, removing from update:`,
      updates.statusText
    );
    delete sanitized_updates.statusText;
  }

  const updated_job = {
    ...sanitized_updates,
    updated_at: new Date().toISOString(),
  };

  const result = await PenPal.DataStore.updateOne(
    "JobsTracker",
    "Jobs",
    { id: job_id },
    updated_job
  );

  // Get the updated job data
  const updatedJobData = await getJob(job_id);

  // Publish job update event with sanitized data
  if (PenPal.PubSub && updatedJobData) {
    const sanitizedJob = sanitizeJobForPubSub(updatedJobData);
    if (sanitizedJob) {
      PenPal.PubSub.publish("JOB_UPDATED", { jobUpdated: sanitizedJob });

      // Also publish active jobs change
      const activeJobs = await getActiveJobs();
      const sanitizedActiveJobs = activeJobs
        .map((job) => sanitizeJobForPubSub(job))
        .filter(Boolean);
      PenPal.PubSub.publish("ACTIVE_JOBS_CHANGED", {
        activeJobsChanged: sanitizedActiveJobs,
      });
    } else {
      logger.error(
        "Failed to sanitize updated job for PubSub:",
        updatedJobData
      );
    }
  }

  return result;
};

export const updateJobs = async (updates_array, update_updated_at = true) => {
  const results = [];
  for (const update of updates_array) {
    const { id, ...updateData } = update;
    const updated_job = {
      ...updateData,
    };
    if (update_updated_at) {
      updated_job.updated_at = new Date().toISOString();
    }
    const result = await PenPal.DataStore.updateOne(
      "JobsTracker",
      "Jobs",
      { id },
      updated_job
    );
    results.push(result);
  }
  return results;
};

export const removeJob = async (job_id) => {
  const result = await PenPal.DataStore.delete("JobsTracker", "Jobs", {
    id: job_id,
  });

  // Publish job deletion event
  if (PenPal.PubSub) {
    PenPal.PubSub.publish("JOB_DELETED", { jobDeleted: job_id });

    // Also publish active jobs change with sanitized data
    const activeJobs = await getActiveJobs();
    const sanitizedActiveJobs = activeJobs
      .map((job) => sanitizeJobForPubSub(job))
      .filter(Boolean);
    PenPal.PubSub.publish("ACTIVE_JOBS_CHANGED", {
      activeJobsChanged: sanitizedActiveJobs,
    });
  }

  return result;
};

export const removeJobs = async (job_ids) => {
  return await PenPal.DataStore.delete("JobsTracker", "Jobs", {
    id: { $in: job_ids },
  });
};

export const upsertJobs = async (jobs) => {
  const jobs_with_timestamps = jobs.map((job) => ({
    ...job,
    created_at: job.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Since there's no upsertMany in the DataStore API, we'll handle this manually
  const results = [];
  for (const job of jobs_with_timestamps) {
    if (job.id) {
      // If job has an ID, try to update existing
      const existing = await PenPal.DataStore.fetchOne("JobsTracker", "Jobs", {
        id: job.id,
      });
      if (existing) {
        const result = await PenPal.DataStore.updateOne(
          "JobsTracker",
          "Jobs",
          { id: job.id },
          job
        );
        results.push(result);
      } else {
        const result = await PenPal.DataStore.insertMany(
          "JobsTracker",
          "Jobs",
          [job]
        );
        results.push(result[0]);
      }
    } else {
      // No ID provided, insert new job and let database generate ID
      const result = await PenPal.DataStore.insertMany("JobsTracker", "Jobs", [
        job,
      ]);
      results.push(result[0]);
    }
  }
  return results;
};

// Stage operations
export const updateJobStage = async (job_id, stage_index, stage_updates) => {
  const job = await getJob(job_id);
  if (!job) {
    throw new Error(`Job with id ${job_id} not found`);
  }

  if (!job.stages || stage_index < 0 || stage_index >= job.stages.length) {
    throw new Error(`Stage index ${stage_index} not found in job ${job_id}`);
  }

  const updated_stages = [...job.stages];
  updated_stages[stage_index] = {
    ...updated_stages[stage_index],
    ...stage_updates,
  };

  return await updateJob(job_id, { stages: updated_stages });
};

export const addJobStage = async (job_id, stage_data) => {
  const job = await getJob(job_id);
  if (!job) {
    throw new Error(`Job with id ${job_id} not found`);
  }

  const stage_with_defaults = {
    name: stage_data.name,
    plugin: stage_data.plugin || job.plugin,
    progress: stage_data.progress || 0.0,
    statusText: stage_data.statusText || "",
    status: stage_data.status || JobStatus.PENDING,
    order: stage_data.order || (job.stages ? job.stages.length : 0),
    metadata: stage_data.metadata || {},
  };

  const updated_stages = [...(job.stages || []), stage_with_defaults];

  return await updateJob(job_id, { stages: updated_stages });
};

// Active jobs query
export const getActiveJobs = async () => {
  return await PenPal.DataStore.fetch("JobsTracker", "Jobs", {
    progress: { $lt: 100 },
  });
};

// Jobs by status
export const getJobsByStatus = async (status) => {
  return await PenPal.DataStore.fetch("JobsTracker", "Jobs", { status });
};

// Get jobs with filtering options
export const getJobsFiltered = async (filterMode = "active") => {
  const now = new Date();

  switch (filterMode) {
    case "active":
      // Only show active jobs and completed jobs from last 10 minutes
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      // First get all jobs, then filter in JavaScript for more reliable filtering
      const allJobs = await PenPal.DataStore.fetch("JobsTracker", "Jobs", {});

      const filteredJobs = allJobs.filter((job) => {
        // Always show jobs that are not completed
        // Use PenPal.Jobs.CompletedStatuses if available, otherwise fallback to hardcoded list
        const completedStatuses = COMPLETED_STATUSES;

        if (!completedStatuses.includes(job.status)) {
          return true;
        }

        // For completed jobs, only show if updated within last 10 minutes
        const jobUpdatedAt = new Date(job.updated_at);
        const isRecent = jobUpdatedAt > tenMinutesAgo;

        return isRecent;
      });

      return filteredJobs;

    case "recent":
      // Jobs from the last day
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return await PenPal.DataStore.fetch("JobsTracker", "Jobs", {
        created_at: { $gte: oneDayAgo.toISOString() },
      });

    case "all":
    default:
      // All jobs
      return await PenPal.DataStore.fetch("JobsTracker", "Jobs", {});
  }
};

// Cleanup stale jobs
export const cleanupStaleJobs = async (timeoutMinutes = 5) => {
  logger.log(
    `Starting cleanup of stale jobs (timeout: ${timeoutMinutes} minutes)`
  );

  // Check if DataStore adapters are ready
  if (!PenPal.DataStore || !PenPal.DataStore.AdaptersReady()) {
    logger.log("DataStore adapters not ready, skipping cleanup");
    return { cancelledCount: 0, jobs: [], error: "DataStore not ready" };
  }

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const cutoffTime = new Date(Date.now() - timeoutMs);

  try {
    // First, get all jobs to see what we're working with
    const allJobs = await PenPal.DataStore.fetch("JobsTracker", "Jobs", {});
    // console.log(`[JobsTracker] Total jobs in database: ${allJobs.length}`);

    // Find jobs that haven't been updated in the specified time and are still active
    const staleJobs = await PenPal.DataStore.fetch("JobsTracker", "Jobs", {
      $and: [
        { updated_at: { $lt: cutoffTime.toISOString() } },
        { progress: { $lt: 100 } },
        {
          status: {
            $nin: [JobStatus.DONE, JobStatus.CANCELLED, JobStatus.FAILED],
          },
        },
      ],
    });

    if (staleJobs.length === 0) {
      logger.log("No stale jobs found");
      return { cancelledCount: 0, jobs: [] };
    }

    // Update stale jobs to cancelled status
    const cancelledStatus = JobStatus.CANCELLED;
    logger.log(
      `Marking ${staleJobs.length} jobs as cancelled with status: ${cancelledStatus}`
    );

    const updates = staleJobs.map((job) => ({
      id: job.id,
      status: cancelledStatus,
      statusText: `Cancelled due to inactivity (no updates for ${timeoutMinutes} minutes)`,
      //updated_at: new Date().toISOString(), // don't update the updated_at field because that will change the runtime calculation
    }));

    const updateResult = await updateJobs(updates, false); // don't update the updated_at field because that will change the runtime calculation

    return {
      cancelledCount: staleJobs.length,
      jobs: staleJobs.map((job) => ({
        id: job.id,
        name: job.name,
        plugin: job.plugin,
        lastUpdated: job.updated_at,
      })),
    };
  } catch (error) {
    logger.error(`Error during cleanup:`, error);
    return { cancelledCount: 0, jobs: [], error: error.message };
  }
};

// Clear all jobs
export const clearAllJobs = async () => {
  logger.log("Starting to clear all jobs from datastore");

  // Check if DataStore adapters are ready
  if (!PenPal.DataStore || !PenPal.DataStore.AdaptersReady()) {
    logger.log("DataStore adapters not ready, cannot clear jobs");
    return { deletedCount: 0, error: "DataStore not ready" };
  }

  try {
    // Get all jobs count before deletion
    const allJobs = await PenPal.DataStore.fetch("JobsTracker", "Jobs", {});
    const totalCount = allJobs.length;

    logger.log(`Found ${totalCount} jobs to clear`);

    // Delete all jobs
    const result = await PenPal.DataStore.delete("JobsTracker", "Jobs", {});

    logger.log(`DataStore delete result:`, result);

    // Publish events for real-time updates
    if (PenPal.PubSub) {
      // Publish that all jobs were cleared
      PenPal.PubSub.publish("ALL_JOBS_CLEARED", {
        allJobsCleared: { deletedCount: totalCount },
      });

      // Also publish active jobs change (now empty) - no sanitization needed for empty array
      PenPal.PubSub.publish("ACTIVE_JOBS_CHANGED", {
        activeJobsChanged: [],
      });
    }

    logger.log(`Successfully cleared ${totalCount} jobs from datastore`);

    return {
      deletedCount: totalCount,
      error: null,
    };
  } catch (error) {
    logger.error("Error clearing all jobs:", error);
    return {
      deletedCount: 0,
      error: error.message,
    };
  }
};
