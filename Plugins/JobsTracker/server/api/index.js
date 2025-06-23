import PenPal from "#penpal/core";
import { JobStatus, COMPLETED_STATUSES } from "../../common/job-constants.js";

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
  const job_with_timestamps = {
    ...job,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const result = await PenPal.DataStore.insertMany("JobsTracker", "Jobs", [
    job_with_timestamps,
  ]);

  const createdJob = result[0];

  // Publish job creation event
  if (PenPal.PubSub) {
    PenPal.PubSub.publish("JOB_CREATED", { jobCreated: createdJob });

    // Also publish active jobs change
    const activeJobs = await getActiveJobs();
    PenPal.PubSub.publish("ACTIVE_JOBS_CHANGED", {
      activeJobsChanged: activeJobs,
    });
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
  const updated_job = {
    ...updates,
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

  // Publish job update event
  if (PenPal.PubSub && updatedJobData) {
    PenPal.PubSub.publish("JOB_UPDATED", { jobUpdated: updatedJobData });

    // Also publish active jobs change
    const activeJobs = await getActiveJobs();
    PenPal.PubSub.publish("ACTIVE_JOBS_CHANGED", {
      activeJobsChanged: activeJobs,
    });
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

    // Also publish active jobs change
    const activeJobs = await getActiveJobs();
    PenPal.PubSub.publish("ACTIVE_JOBS_CHANGED", {
      activeJobsChanged: activeJobs,
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
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const cutoffTime = new Date(Date.now() - timeoutMs);

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
    return { cancelledCount: 0, jobs: [] };
  }

  // Update stale jobs to cancelled status
  const cancelledStatus = JobStatus.CANCELLED;
  const updates = staleJobs.map((job) => ({
    id: job.id,
    status: cancelledStatus,
    statusText: `Cancelled due to inactivity (no updates for ${timeoutMinutes} minutes)`,
    //updated_at: new Date().toISOString(), // don't update the updated_at field because that will change the runtime calculation
  }));

  await updateJobs(updates, false); // don't update the updated_at field because that will change the runtime calculation

  console.log(`[JobsTracker] Cleaned up ${staleJobs.length} stale jobs`);

  return {
    cancelledCount: staleJobs.length,
    jobs: staleJobs.map((job) => ({
      id: job.id,
      name: job.name,
      plugin: job.plugin,
      lastUpdated: job.updated_at,
    })),
  };
};
