import { types, resolvers, loaders } from "./graphql";
import dockerfile from "./Dockerfile.js";

import { workflow_nodes } from "./nodes";
import new_network_host_discovery_workflow from "./workflows/New_Network_Host_Discovery.json";

const settings = {
  docker: {
    name: "masscan",
    dockerfile
  },
  n8n: {
    workflow_nodes,
    workflows: [new_network_host_discovery_workflow]
  }
};

const MasscanPlugin = {
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

export default MasscanPlugin;
