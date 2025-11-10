import PenPal from "#penpal/core";

export default {
  queries: {
    async getRunningContainers() {
      return await PenPal.TestRange.GetRunningContainers();
    },
    async getContainerInfo(parent, { containerId }) {
      return await PenPal.TestRange.GetContainerInfo(containerId);
    },
    async getAvailableContainers() {
      return await PenPal.TestRange.GetAvailableContainers();
    },
    async getRecentContainers(parent, { limit }) {
      return await PenPal.TestRange.GetRecentContainers(limit || 50);
    },
  },
  mutations: {
    async startContainer(parent, { containerId }) {
      return await PenPal.TestRange.StartContainer(containerId);
    },
    async stopContainer(parent, { containerId }) {
      return await PenPal.TestRange.StopContainer(containerId);
    },
    async removeContainer(parent, { containerId }) {
      return await PenPal.TestRange.RemoveContainer(containerId);
    },
    async restartContainer(parent, { containerId }) {
      return await PenPal.TestRange.RestartContainer(containerId);
    },
    async deployVulhubContainer(parent, { containerPath, containerName }) {
      return await PenPal.TestRange.DeployVulhubContainer(
        containerPath,
        containerName
      );
    },
  },
  default_resolvers: [],
  scalars: [],
};
