import * as API from "../../api/index.js";
import PenPal from "#penpal/core";

export default {
  async createJob(parent, { input }, context) {
    return await API.insertJob(input);
  },

  async updateJob(parent, { id, input }, context) {
    return await API.updateJob(id, input);
  },

  async updateJobStage(parent, { jobId, stageIndex, input }, context) {
    return await API.updateJobStage(jobId, stageIndex, input);
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
