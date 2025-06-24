import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as url from "url";
import * as Nmap from "./nmap.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const settings = {
  docker: {
    name: "penpal:nmap",
    dockercontext: `${__dirname}/docker-context`,
  },
  STATUS_SLEEP: 500,
  scan_configurations: {
    fast: {
      name: "Fast Scan",
      description: "Fast scan of the network",
      top_ports: 1000,
      fast_scan: true,
    },
    detailed: {
      name: "Detailed Scan",
      description: "Detailed scan of the network",
      tcp_ports: ["1-65535"],
      udp_ports: [53, 111, 135, "137-139", "161-162"],
    },
  },
};

// push and pop out of this work queue for if a job is running. To be implemented
export const work_queue = [];

// File-level logger that can be imported by other files
export const NmapLogger = PenPal.Utils.BuildLogger("Nmap");

const start_detailed_hosts_scan = async ({ project, host_ids }) => {
  // Create job using the centralized Jobs API
  const job = await PenPal.Jobs.Create({
    name: `Detailed Host Scan for ${host_ids.length} hosts in ${project}`,
    plugin: "Nmap",
    progress: 0.0,
    statusText: "Beginning detailed host scan...",
    project_id: project,
    stages: [
      {
        name: "SYN Stealth Scan",
        plugin: "Nmap",
        progress: 0.0,
        statusText: "Preparing SYN scan...",
        order: 0,
      },
      {
        name: "Service Scan",
        plugin: "Nmap",
        progress: 0.0,
        statusText: "Waiting for SYN scan completion",
        order: 1,
      },
      {
        name: "Script Scan",
        plugin: "Nmap",
        progress: 0.0,
        statusText: "Waiting for Service Scan completion",
        order: 2,
      },
    ],
  });

  const update_job = async (progress, statusText, currentStage = null) => {
    // Use the centralized Jobs API to update progress
    await PenPal.Jobs.UpdateProgress(
      job.id,
      progress,
      statusText,
      currentStage
    );
  };

  const hosts = (await PenPal.API.Hosts.GetMany(host_ids)) ?? [];
  const ips = hosts.map((host) => host.ip_address);
  if (ips.length > 0) {
    await Nmap.performScan({
      project_id: project,
      ips,
      update_job,
      job_id: job.id,
      ...settings.scan_configurations.detailed,
    });
  }
};

const start_initial_networks_scan = async ({ project, network_ids }) => {
  // Create job using the centralized Jobs API
  const job = await PenPal.Jobs.Create({
    name: `Initial Network Scan for ${project}: ${network_ids}`,
    plugin: "Nmap",
    progress: 0.0,
    statusText: "Beginning network scan...",
    project_id: project,
  });

  const update_job = async (progress, statusText) => {
    // Use the centralized Jobs API to update progress
    await PenPal.Jobs.Update(job.id, {
      progress,
      statusText,
    });
  };

  const networks =
    (await PenPal.API.Networks.GetMany(network_ids))?.map(
      (network) =>
        `${network.subnet.network_address}/${network.subnet.subnet_mask}`
    ) ?? [];

  if (networks.length > 0) {
    for (let network of networks) {
      await Nmap.performScan({
        project_id: project,
        networks: [network],
        update_job,
        job_id: job.id,
        ...settings.scan_configurations.fast,
      });
    }
  }
};

const NmapPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();

    // Wrap scan functions in ScanQueue
    const queueHostsScan = async (args) => {
      const { project, host_ids } = args;
      const queueName = `Nmap Detailed Host Scan (${host_ids.length} hosts), Project: ${project}`;

      // Be polite and wait 10 seconds before adding to the queue
      await PenPal.Utils.Sleep(10000);

      PenPal.ScanQueue.Add(
        async () => await start_detailed_hosts_scan(args),
        queueName
      );
    };

    const queueNetworksScan = async (args) => {
      const { project, network_ids } = args;
      const queueName = `Nmap Quick Network Scan (${network_ids.length} networks), Project: ${project}`;

      PenPal.ScanQueue.Add(
        async () => await start_initial_networks_scan(args),
        queueName
      );
    };

    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Networks,
      queueNetworksScan
    );
    await MQTT.Subscribe(PenPal.API.MQTT.Topics.New.Hosts, queueHostsScan);

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

export default NmapPlugin;
