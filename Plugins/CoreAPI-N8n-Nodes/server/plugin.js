import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import { workflow_nodes, trigger_nodes } from "./nodes/index.js";

const settings = {
  n8n: {
    workflow_nodes,
    trigger_nodes,
  },
};

const CoreAPIN8nNodesPlugin = {
  async loadPlugin() {
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

export default CoreAPIN8nNodesPlugin;
