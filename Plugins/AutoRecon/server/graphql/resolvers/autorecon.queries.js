import * as API from "../../api/index.js";

export default {
  async getAutoReconScans(parent, { projectId }) {
    return await API.getAutoReconScans(projectId);
  },

  async getStagedAssets(parent, { projectId }) {
    return await API.getStagedAssets(projectId);
  },
};
