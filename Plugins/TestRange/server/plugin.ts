import PenPal from "#penpal/core";
import type { PenPalPlugin, PluginLoadResult } from "#penpal/common";
import { loadGraphQLFiles, resolvers } from "./graphql/index.ts";
import * as url from "url";
import * as TestRangeAPI from "./api/index.ts";

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

const TestRangePlugin: PenPalPlugin = {
  async loadPlugin(): Promise<PluginLoadResult> {
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

