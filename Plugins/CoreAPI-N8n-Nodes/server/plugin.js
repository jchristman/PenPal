import { types, resolvers, loaders } from "./graphql";
import { workflow_nodes, trigger_nodes } from "./nodes";

const settings = {
  n8n: {
    workflow_nodes,
    trigger_nodes
  }
};

const CoreAPIN8nNodesPlugin = {
  loadPlugin() {
    return {
      graphql: {
        types,
        resolvers
      },
      settings
    };
  }
};

export default CoreAPIN8nNodesPlugin;
