import PenPal from "#penpal/core";
import type { PenPalPlugin, PluginLoadResult } from "#penpal/common";
import { loadGraphQLFiles, resolvers } from "./graphql/index.ts";
import * as url from "url";
import * as Ping from "./ping.ts";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

interface PingScanOptions {
  project_id: string;
  networks: string[];
  update_job: (progress: number, statusText: string) => Promise<void>;
  job_id: string;
}

export const settings = {
  docker: {
    name: "penpal:ping",
    dockercontext: `${__dirname}/docker-context`,
  },
  STATUS_SLEEP: 900,
  configuration: {
    schema_root: "PingConfiguration",
    getter: "getPingConfiguration",
    setter: "setPingConfiguration",
  },
  datastores: [{ name: "Configuration" }],
};

// Function to start initial network scan
const start_initial_networks_scan = async (args: { project: string; network_ids: string[] }): Promise<void> => {
  const { project, network_ids } = args;
  // Create job using the centralized Jobs API
  const job = await PenPal.Jobs.Create({
    name: `Initial Ping Scan for ${project}: ${network_ids}`,
    plugin: "Ping",
    progress: 0.0,
    statusText: "Beginning network scan...",
    project_id: project,
  });

  const update_job = async (progress, statusText) => {
    await PenPal.Jobs.Update(job.id, { progress, statusText });
  };

  const networks =
    (await PenPal.API.Networks.GetMany(network_ids))?.map(
      (network) =>
        `${network.subnet.network_address}/${network.subnet.subnet_mask}`
    ) ?? [];

  if (networks.length > 0) {
    for (let network of networks) {
      await Ping.performScan({
        project_id: project,
        networks: [network],
        update_job,
        job_id: job.id,
      });
    }
  }
};

const PingPlugin: PenPalPlugin = {
  async loadPlugin(): Promise<PluginLoadResult> {
    const MQTT = await PenPal.MQTT.NewClient();

    const queueNetworksScan = async (args) => {
      const { project, network_ids } = args;
      const queueName = `Ping Quick Network Scan (${network_ids.length} networks), Project: ${project}`;

      PenPal.ScanQueue.Add(
        async () => await start_initial_networks_scan(args),
        queueName
      );
    };

    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Networks,
      queueNetworksScan
    );

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

export default PingPlugin;
