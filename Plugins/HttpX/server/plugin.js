import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

import { performHttpScan } from "./httpx.js";

export const settings = {
  docker: {
    name: "penpal:httpx",
    dockercontext: `${__dirname}/docker-context`,
  },
  STATUS_SLEEP: 1000,
};

const start_http_service_scan = async ({ project, service_ids }) => {
  console.log("HttpX: New Services:", service_ids);

  // Create job using the centralized Jobs API
  const job = await PenPal.Jobs.Create({
    name: `HTTP Service Discovery for ${service_ids.length} services in project ${project}`,
    plugin: "HttpX",
    progress: 0.0,
    statusText: "Beginning HTTP service discovery...",
    project_id: project,
  });

  const update_job = async (progress, statusText) => {
    // Use the centralized Jobs API to update progress
    await PenPal.Jobs.Update(job.id, {
      progress,
      statusText,
    });
  };

  console.log("HttpX: New Services:", service_ids);

  // Get the service details
  const services = (await PenPal.API.Services.GetMany(service_ids)) ?? [];

  // Filter services to only include network services with ports
  // These are likely to be potential HTTP services
  const network_services = services.filter(
    (service) =>
      service.port &&
      service.ip_protocol.toLowerCase() === "tcp" &&
      service.status === "open"
  );

  if (network_services.length > 0) {
    console.log(
      `[HttpX] Found ${network_services.length} TCP services to check for HTTP`
    );

    // Get host information for the services
    const hosts_map = {};
    for (const service of network_services) {
      if (service.host && !hosts_map[service.host]) {
        const host_data = await PenPal.API.Hosts.Get(service.host);
        hosts_map[service.host] = host_data;
        service.host_ip = host_data?.ip_address;
      } else if (hosts_map[service.host]) {
        service.host_ip = hosts_map[service.host].ip_address;
      }
    }

    await performHttpScan({
      project_id: project,
      services: network_services,
      update_job,
      job_id: job.id,
    });
  } else {
    console.log("[HttpX] No suitable network services found for HTTP scanning");
    await update_job(100.0, "No HTTP services found");

    if (job.id) {
      await PenPal.Jobs.Update(job.id, {
        status: PenPal.Jobs.Status.DONE,
        progress: 100.0,
        statusText: "No suitable services for HTTP scanning",
      });
    }
  }
};

const HttpXPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();

    // Subscribe to new services events
    // This will trigger when new open ports/services are discovered
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Services,
      start_http_service_scan
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

export default HttpXPlugin;
