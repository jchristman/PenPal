import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

import { performMasscan } from "./api.js";

const settings = {
  docker: {
    name: "masscan",
    dockerfile: `${__dirname}/Dockerfile`,
  },
};

const default_scan = {
  tcp_ports: [22, 445, 1883, 3000],
  udp_ports: [],
  scanRate: 1000,
  ping: false,
};

const start_scan = async ({ project, host_ids }) => {
  const ips =
    (await PenPal.API.Hosts.GetMany(host_ids))?.map(
      (host) => host.ip_address
    ) ?? [];

  if (ips.length > 0) {
    await performMasscan({
      project_id: project,
      ips,
      ...default_scan,
    });
  }
};

const MasscanPlugin = {
  async loadPlugin() {
    const types = await loadGraphQLFiles();

    const MQTT = await PenPal.MQTT.NewClient();
    await MQTT.Subscribe(PenPal.API.MQTT.Topics.New.Hosts, start_scan);

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
