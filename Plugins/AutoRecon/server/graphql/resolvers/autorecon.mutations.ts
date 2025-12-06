import * as API from "../../api/index.ts";

export default {
  async startAutoReconScan(_parent: any, { projectId }: { projectId: string }) {
    return await API.startAutoReconScan(projectId);
  },

  async acceptStagedAssets(_parent: any, { projectId, assetIds }: { projectId: string; assetIds: string[] }) {
    return await API.acceptStagedAssets(projectId, assetIds);
  },

  async rejectStagedAssets(_parent: any, { projectId, assetIds }: { projectId: string; assetIds: string[] }) {
    return await API.rejectStagedAssets(projectId, assetIds);
  },
};
