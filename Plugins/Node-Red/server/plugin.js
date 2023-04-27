import PenPal from "#penpal/core";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const NodeRedPlugin = {
  async loadPlugin() {
    await PenPal.Docker.Compose({
      name: "node-red",
      docker_compose_path: `${__dirname}/docker-compose.node-red.yaml`,
    });

    return {};
  },
};

export default NodeRedPlugin;
