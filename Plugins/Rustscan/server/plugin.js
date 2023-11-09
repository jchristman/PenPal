import PenPal from "#penpal/core";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

import { performDetailedScan, performDiscoveryScan } from "./rustscan.js";

const settings = {
  docker: {
    name: "penpal:rustscan",
    dockercontext: `${__dirname}/docker-context`,
  },
};

const default_discovery_scan = {
  //tcp_ports: [22, 25, 53, 80, 443, 445, 3000, 3389, 8080],
  top_ports: 1000,
};

const default_detailed_scan = {
  top_ports: 65535,
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

const RustscanPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();
    await MQTT.Subscribe(PenPal.API.MQTT.Topics.New.Hosts, start_hosts_scan);
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Networks,
      start_networks_scan
    );

    return {
      settings,
    };
  },
};

export default RustscanPlugin;
