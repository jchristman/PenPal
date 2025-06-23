import * as API from "../../api/index.js";
import PenPal from "#penpal/core";

export default {
  async createJob(parent, { input }, context) {
    // Validate status if provided
    if (input.status) {
      validateStatus(input.status);
    }

    const job = await API.insertJob({
      ...input,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return job;
  },

  async updateJob(parent, { id, input }, context) {
    if (input.status) {
      validateStatus(input.status);
    }

    await API.updateJob(id, input);
    return await API.getJob(id);
  },

  async updateJobStage(parent, { jobId, stageIndex, input }, context) {
    await API.updateJobStage(jobId, stageIndex, input);
    return await API.getJob(jobId);
  },

  async deleteJob(parent, { id }, context) {
    await API.removeJob(id);
    return true;
  },

  async deleteJobs(parent, { ids }, context) {
    await API.removeJobs(ids);
    return true;
  },

  async cleanupStaleJobs(parent, { timeoutMinutes = 5 }, context) {
    return await API.cleanupStaleJobs(timeoutMinutes);
  },

  async clearAllJobs(parent, args, context) {
    return await API.clearAllJobs();
  },
};
