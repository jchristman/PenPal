import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import PenPal from "#penpal/core";

PenPal.Test = {};

const REPLACE_MEPlugin = {
  async loadPlugin() {
    const types = await loadGraphQLFiles();

    return {
      graphql: {
        types,
        resolvers,
      },
    };
  },
};

export default REPLACE_MEPlugin;
