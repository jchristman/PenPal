import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import PenPal from "#penpal/core";

const E2ETestingPlugin = {
  async loadPlugin() {
    // Set up dependency injection
    const { CoreAPI, Docker, JobsTracker } = PenPal.API;

    const types = await loadGraphQLFiles();

    return {
      graphql: {
        types,
        resolvers,
      },
    };
  },
};

export default E2ETestingPlugin;
