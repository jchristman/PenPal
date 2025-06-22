import * as API from "../../api/index.js";
import PenPal from "#penpal/core";

export default {
  async createJob(parent, { input }, context) {
    // Generate IDs for stages if not provided
    const stages =
      input.stages?.map((stage) => ({
        ...stage,
        id: stage.id || PenPal.Utils.UUID(),
      })) || [];

    const jobData = {
      ...input,
      stages,
    };

    return await API.insertJob(jobData);
  },

  async updateJob(parent, { id, input }, context) {
    return await API.updateJob(id, input);
  },

  async updateJobStage(parent, { jobId, stageId, input }, context) {
    return await API.updateJobStage(jobId, stageId, input);
  },

  async deleteJob(parent, { id }, context) {
    await API.removeJob(id);
    return true;
  },

  async deleteJobs(parent, { ids }, context) {
    await API.removeJobs(ids);
    return true;
  },
};
