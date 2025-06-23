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

const start_http_service_scan_batch = async (batchedArgs) => {
  // Collect all unique service IDs and projects from the batched arguments
  const projectServiceMap = new Map();
  let totalServices = 0;

  for (const [{ project, service_ids }] of batchedArgs) {
    if (!projectServiceMap.has(project)) {
      projectServiceMap.set(project, new Set());
    }
    service_ids.forEach((id) => projectServiceMap.get(project).add(id));
    totalServices += service_ids.length;
  }

  // Process each project's services
  for (const [project, serviceIdSet] of projectServiceMap) {
    const service_ids = Array.from(serviceIdSet);

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
        `[HttpX] Found ${network_services.length} TCP services to check for HTTP in project ${project}`
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
      console.log(
        `[HttpX] No suitable network services found for HTTP scanning in project ${project}`
      );
      await update_job(100.0, "No HTTP services found");

      if (job.id) {
        await PenPal.Jobs.Update(job.id, {
          status: PenPal.Jobs.Status.DONE,
          progress: 100.0,
          statusText: "No suitable services for HTTP scanning",
        });
      }
    }
  }
};

const HttpXPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();

    // Subscribe to new services events
    // This will trigger when new open ports/services are discovered
    // Use BatchFunction to batch rapid service discovery events with a 5-second timeout
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Services,
      PenPal.Utils.BatchFunction(start_http_service_scan_batch, 5000)
    );

    // Register test handlers with the Tester plugin (if available)
    if (PenPal.Tester) {
      // Test handler that performs an HTTP scan on provided URLs
      PenPal.Tester.RegisterHandler(
        "HttpX",
        async (urls, project_id) => {
          try {
            // Validate project ID
            if (!project_id || typeof project_id !== "string") {
              throw new Error("Project ID is required and must be a string");
            }

            // Parse URLs input
            let urlList;
            if (typeof urls === "string") {
              urlList = urls
                .split("\n")
                .filter((url) => url.trim())
                .map((url) => url.trim());
            } else if (Array.isArray(urls)) {
              urlList = urls;
            } else {
              throw new Error(
                "URLs must be a string (newline-separated) or an array"
              );
            }

            if (urlList.length === 0) {
              throw new Error("No URLs provided");
            }

            // Convert URLs to mock services for testing
            const mockServices = urlList.map((url, index) => {
              try {
                const urlObj = new URL(url);
                const port =
                  urlObj.port || (urlObj.protocol === "https:" ? 443 : 80);
                return {
                  id: `test_service_${index}`,
                  host_ip: urlObj.hostname, // Direct host IP for compatibility
                  host: {
                    ip_address: urlObj.hostname, // Also provide host object structure for real service compatibility
                  },
                  port: parseInt(port),
                  ip_protocol: "TCP",
                  status: "open",
                };
              } catch (e) {
                throw new Error(`Invalid URL: ${url} - ${e.message}`);
              }
            });

            console.log(
              `[HttpX Test] Testing ${mockServices.length} URLs for project ${project_id}`
            );

            // Create a test job
            const job = await PenPal.Jobs.Create({
              name: `HttpX Test Scan for ${mockServices.length} URLs (Project: ${project_id})`,
              plugin: "HttpX",
              progress: 0,
              statusText: "Starting HTTP test scan...",
              project_id: project_id,
            });

            const update_job = async (progress, statusText) => {
              await PenPal.Jobs.Update(job.id, {
                progress,
                statusText,
              });
            };

            // Perform the HTTP scan
            const results = await performHttpScan({
              project_id: project_id,
              services: mockServices,
              update_job,
              job_id: job.id,
            });

            return {
              success: true,
              project_id: project_id,
              scanned_urls: urlList,
              results_count: results?.length || 0,
              job_id: job.id,
              message: `Successfully scanned ${urlList.length} URLs for project ${project_id}`,
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            // Log full error details on server side
            console.error("[HttpX Test] HTTP URL Scanner failed:", error);
            console.error("[HttpX Test] Stack trace:", error.stack);

            return {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [
          {
            name: "urls",
            type: "string",
            required: true,
            description:
              "URLs to scan (one per line, e.g., https://example.com\\nhttps://google.com)",
          },
          {
            name: "project_id",
            type: "string",
            required: true,
            description: "Project ID to associate the scanned services with",
          },
        ],
        "HTTP URL Scanner"
      );

      // Test handler that checks if HttpX Docker image is ready
      PenPal.Tester.RegisterHandler(
        "HttpX",
        async () => {
          try {
            const imageName = settings.docker.name;
            const isReady = PenPal.Docker.IsImageReady(imageName);
            const isBuilding = PenPal.Docker.IsImageBuilding(imageName);
            const isFailed = PenPal.Docker.IsImageFailed(imageName);

            return {
              image_name: imageName,
              is_ready: isReady,
              is_building: isBuilding,
              is_failed: isFailed,
              status: isReady
                ? "Ready"
                : isBuilding
                ? "Building"
                : isFailed
                ? "Failed"
                : "Unknown",
              message: isReady
                ? "HttpX Docker image is ready for use"
                : isBuilding
                ? "HttpX Docker image is currently building"
                : isFailed
                ? "HttpX Docker image build failed"
                : "HttpX Docker image status unknown",
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            // Log full error details on server side
            console.error(
              "[HttpX Test] Docker Image Status check failed:",
              error
            );
            console.error("[HttpX Test] Stack trace:", error.stack);

            return {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [],
        "Check Docker Image Status"
      );

      console.log("[HttpX] Registered test handlers with Tester plugin");
    }

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
