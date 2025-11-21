import * as API from "../../api/index.ts";

export default {
  async getAutoReconScans(_parent: any, { projectId }: { projectId: string }) {
    return await API.getAutoReconScans(projectId);
  },

  async getStagedAssets(_parent: any, { projectId }: { projectId: string }) {
    return await API.getStagedAssets(projectId);
  },
};
