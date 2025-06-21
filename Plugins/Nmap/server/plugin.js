import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

import { performScan } from "./nmap.js";

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

// this variable is passed by reference to PenPal
export const jobs = [];

const start_detailed_hosts_scan = async ({ project, host_ids }) => {
  const job = {
    id: jobs.length,
    name: `Detailed Host Scan for ${host_ids.length} hosts in ${project}`,
    plugin: "Nmap",
    progress: 0.0,
    statusText: "Beginning detailed host scan...",
    stages: [
      {
        id: `${jobs.length}-syn`,
        name: "SYN Stealth Scan",
        plugin: "Nmap",
        progress: 0.0,
        statusText: "Preparing SYN scan...",
      },
      {
        id: `${jobs.length}-service`,
        name: "Service Scan",
        plugin: "Nmap",
        progress: 0.0,
        statusText: "Waiting for SYN scan completion",
      },
      {
        id: `${jobs.length}-script`,
        name: "Script Scan",
        plugin: "Nmap",
        progress: 0.0,
        statusText: "Waiting for Service Scan completion",
      },
    ],
  };
  // insert the job at index initial_job.id
  jobs.splice(job.id, 0, job);
  const update_job = async (progress, statusText, currentStage = null) => {
    job.statusText = statusText;

    // Update current stage progress if specified
    if (currentStage !== null && job.stages[currentStage]) {
      job.stages[currentStage].progress = progress;
      job.stages[currentStage].statusText = statusText;
    }

    // Calculate overall job progress based on completed stages
    const totalStages = job.stages.length;
    let completedStages = 0;
    let activeStageProgress = 0;
    let activeStageIndex = -1;

    // Count completed stages and find active stage
    for (let i = 0; i < job.stages.length; i++) {
      if (job.stages[i].progress >= 100) {
        completedStages++;
      } else if (job.stages[i].progress > 0) {
        activeStageIndex = i;
        activeStageProgress = job.stages[i].progress;
        break; // First non-complete stage with progress is the active one
      }
    }

    // If no stage has progress yet but we have a current stage specified, use that
    if (activeStageIndex === -1 && currentStage !== null && currentStage >= 0) {
      activeStageIndex = currentStage;
      activeStageProgress = progress;
    }

    // Calculate overall progress: each completed stage contributes equal weight
    // Plus partial progress from the currently active stage
    const stageWeight = 100 / totalStages; // ~33.33% per stage for 3 stages
    const baseProgress = completedStages * stageWeight;
    const currentStageContribution =
      activeStageIndex >= 0 ? (activeStageProgress / 100) * stageWeight : 0;

    job.progress = Math.min(100, baseProgress + currentStageContribution);
  };

  const hosts = (await PenPal.API.Hosts.GetMany(host_ids)) ?? [];
  const ips = hosts.map((host) => host.ip_address);
  if (ips.length > 0) {
    await performScan({
      project_id: project,
      ips,
      update_job,
      job_stages: job.stages,
      ...settings.scan_configurations.detailed,
    });
  }
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
      await performScan({
        project_id: project,
        networks: [network],
        update_job,
        job_stages: null,
        ...settings.scan_configurations.fast,
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
      PenPal.API.MQTT.Topics.New.Hosts,
      start_detailed_hosts_scan
    );

    const types = await loadGraphQLFiles();

    return {
      graphql: {
        types,
        resolvers,
      },
      settings,
      jobs,
    };
  },
};

export default NmapPlugin;
