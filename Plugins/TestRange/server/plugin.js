import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as url from "url";
import * as TestRangeAPI from "./api/index.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const settings = {
  datastores: [
    {
      name: "RecentContainers",
    },
  ],
};

// File-level logger that can be imported by other files
export const TestRangeLogger = PenPal.Utils.BuildLogger("TestRange");

const TestRangePlugin = {
  async loadPlugin() {
    // Expose API
    PenPal.TestRange = {
      GetRunningContainers: TestRangeAPI.getRunningContainers,
      GetContainerInfo: TestRangeAPI.getContainerInfo,
      StartContainer: TestRangeAPI.startContainer,
      StopContainer: TestRangeAPI.stopContainer,
      RemoveContainer: TestRangeAPI.removeContainer,
      RestartContainer: TestRangeAPI.restartContainer,
      GetAvailableContainers: TestRangeAPI.getAvailableContainers,
      GetRecentContainers: TestRangeAPI.getRecentContainers,
      DeployVulhubContainer: TestRangeAPI.deployVulhubContainer,
    };

    const types = await loadGraphQLFiles();

    return {
      graphql: {
        types,
        resolvers,
      },
      settings,
    };
  },
};

export default TestRangePlugin;

