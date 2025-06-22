import * as API from "../../api/index.js";

export default {
  async getJob(parent, { id }, context) {
    return await API.getJob(id);
  },

  async getJobs(parent, { ids }, context) {
    return await API.getJobs(ids);
  },

  async getJobsByPlugin(parent, { plugin }, context) {
    return await API.getJobsByPlugin(plugin);
  },

  async getActiveJobs(parent, args, context) {
    return await API.getActiveJobs();
  },

  async getJobsByStatus(parent, { status }, context) {
    return await API.getJobsByStatus(status);
  },

  async getAllJobs(parent, { limit, offset, plugin, status }, context) {
    let jobs;

    if (plugin) {
      jobs = await API.getJobsByPlugin(plugin);
    } else if (status) {
      jobs = await API.getJobsByStatus(status);
    } else {
      jobs = await API.getJobs();
    }

    // Apply pagination
    const totalCount = jobs.length;
    const paginatedJobs = jobs.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    return {
      jobs: paginatedJobs,
      totalCount,
      hasMore,
    };
  },
};
