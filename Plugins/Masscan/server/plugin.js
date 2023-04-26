import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import fs from "fs";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

import { workflow_nodes } from "./nodes/index.js";
import new_network_host_discovery_workflow from "./workflows/New_Network_Host_Discovery.json" assert { type: "json" };

const settings = {
  docker: {
    name: "masscan",
    dockerfile: fs.readFileSync(`${__dirname}/Dockerfile`, {
      encoding: "utf8",
      flag: "r",
    }),
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
