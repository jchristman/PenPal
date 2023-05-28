import PenPal from "#penpal/core";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const MosquittoPlugin = {
  async loadPlugin() {
    await PenPal.Docker.Compose({
      name: "penpal-mosquitto",
      docker_compose_path: `${__dirname}/mosquitto/docker-compose.mosquitto.yaml`,
    });

    return {};
  },
};

export default MosquittoPlugin;
