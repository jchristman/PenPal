import PenPal from "#penpal/core";

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
    id: job.id || PenPal.Utils.UUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const result = await PenPal.DataStore.insertMany("JobsTracker", "Jobs", [
    job_with_timestamps,
  ]);
  return result[0]; // Return the first (and only) inserted job
};

export const insertJobs = async (jobs) => {
  const jobs_with_timestamps = jobs.map((job) => ({
    ...job,
    id: job.id || PenPal.Utils.UUID(),
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

  return await PenPal.DataStore.updateOne(
    "JobsTracker",
    "Jobs",
    { id: job_id },
    updated_job
  );
};

export const updateJobs = async (updates_array) => {
  const results = [];
  for (const update of updates_array) {
    const { id, ...updateData } = update;
    const result = await PenPal.DataStore.updateOne(
      "JobsTracker",
      "Jobs",
      { id },
      {
        ...updateData,
        updated_at: new Date().toISOString(),
      }
    );
    results.push(result);
  }
  return results;
};

export const removeJob = async (job_id) => {
  return await PenPal.DataStore.delete("JobsTracker", "Jobs", { id: job_id });
};

export const removeJobs = async (job_ids) => {
  return await PenPal.DataStore.delete("JobsTracker", "Jobs", {
    id: { $in: job_ids },
  });
};

export const upsertJobs = async (jobs) => {
  const jobs_with_timestamps = jobs.map((job) => ({
    ...job,
    id: job.id || PenPal.Utils.UUID(),
    created_at: job.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Since there's no upsertMany in the DataStore API, we'll handle this manually
  const results = [];
  for (const job of jobs_with_timestamps) {
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
      const result = await PenPal.DataStore.insertMany("JobsTracker", "Jobs", [
        job,
      ]);
      results.push(result[0]);
    }
  }
  return results;
};

// Stage operations
export const updateJobStage = async (job_id, stage_id, stage_updates) => {
  const job = await getJob(job_id);
  if (!job) {
    throw new Error(`Job with id ${job_id} not found`);
  }

  const updated_stages =
    job.stages?.map((stage) =>
      stage.id === stage_id ? { ...stage, ...stage_updates } : stage
    ) || [];

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
