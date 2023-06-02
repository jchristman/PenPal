import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

import { performDetailedScan, performDiscoveryScan } from "./api.js";

const settings = {
  docker: {
    name: "masscan",
    dockerfile: `${__dirname}/Dockerfile`,
  },
};

const default_discovery_scan = {
  tcp_ports: [22, 25, 53, 80, 443, 445, 3389, 8080],
  udp_ports: [53, 135, 139, 161],
  scanRate: 10000,
  ping: true,
};

const default_detailed_scan = {
  top_ports: 1000,
  scanRate: 10000,
  ping: false,
};

const start_hosts_scan = async ({ project, host_ids }) => {
  const ips =
    (await PenPal.API.Hosts.GetMany(host_ids))?.map(
      (host) => host.ip_address
    ) ?? [];

  if (ips.length > 0) {
    await performDetailedScan({
      project_id: project,
      ips,
      ...default_detailed_scan,
    });
  }
};

const start_networks_scan = async ({ project, network_ids }) => {
  const networks =
    (await PenPal.API.Networks.GetMany(network_ids))?.map(
      (network) =>
        `${network.subnet.network_address}/${network.subnet.subnet_mask}`
    ) ?? [];

  if (networks.length > 0) {
    for (let network of networks) {
      await performDiscoveryScan({
        project_id: project,
        networks: [network],
        ...default_discovery_scan,
      });
    }
  }
};

const MasscanPlugin = {
  async loadPlugin() {
    const types = await loadGraphQLFiles();

    const MQTT = await PenPal.MQTT.NewClient();
    await MQTT.Subscribe(PenPal.API.MQTT.Topics.New.Hosts, start_hosts_scan);
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Networks,
      start_networks_scan
    );

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
