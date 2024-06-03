import PenPal from "#penpal/core";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

import { performScan as performDiscoveryScan } from "./nmap.js";

export const settings = {
  docker: {
    name: "penpal:nmap",
    dockercontext: `${__dirname}/docker-context`,
  },
  STATUS_SLEEP: 500,
};

// push and pop out of this work queue for if a job is running. To be implemented
export const work_queue = [];

// this variable is passed by reference to PenPal for reference
export const jobs = [];

const start_services_scan = async ({ project, service_ids }) => {
  const services =
    (await PenPal.API.Services.GetMany(service_ids))?.map(
      (service) => service
    ) ?? [];

  console.log("Nmap: New Services:", services);
};

const start_initial_networks_scan = async ({ project, network_ids }) => {
  const job = {
    id: jobs.length,
    name: `Initial Network Scan for ${project}: ${network_ids}`,
    plugin: "Nmap",
    progress: 0.0,
    statusText: "Beginning network scan...",
  };
  // insert the job at index initial_job.id
  jobs.splice(job.id, 0, job);
  const update_job = async (progress, statusText) => {
    job.progress = progress;
    job.statusText = statusText;
  };

  console.log("Nmap: New Networks:", network_ids);
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
        top_ports: 1000,
        fast_scan: true,
        update_job,
      });
    }
  }
};

const NmapPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Networks,
      start_initial_networks_scan
    );
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Services,
      start_services_scan
    );

    return {
      settings,
      jobs,
    };
  },
};

export default NmapPlugin;
