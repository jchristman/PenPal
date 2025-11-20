import * as API from "../../api/index.js";

export default {
  async startAutoReconScan(parent, { projectId }) {
    return await API.startAutoReconScan(projectId);
  },

  async acceptStagedAssets(parent, { projectId, assetIds }) {
    return await API.acceptStagedAssets(projectId, assetIds);
  },

  async rejectStagedAssets(parent, { projectId, assetIds }) {
    return await API.rejectStagedAssets(projectId, assetIds);
  },
};
