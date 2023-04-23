import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import dockerfile from "./Dockerfile.js";

import { workflow_nodes } from "./nodes/index.js";
import new_network_host_discovery_workflow from "./workflows/New_Network_Host_Discovery.json" assert { type: "json" };

const settings = {
  docker: {
    name: "masscan",
    dockerfile,
  },
  n8n: {
    workflow_nodes,
    workflows: [new_network_host_discovery_workflow],
  },
};

const MasscanPlugin = {
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

export default MasscanPlugin;
