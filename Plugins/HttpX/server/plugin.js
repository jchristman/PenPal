import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as HttpX from "./httpx.js";

// File-level logger that can be imported by other files
export const HttpXLogger = PenPal.Utils.BuildLogger("HttpX");

export const settings = {
  docker: {
    // Use the official ProjectDiscovery HttpX image
    image: "projectdiscovery/httpx:latest",
    name: "penpal:httpx",
  },
  STATUS_SLEEP: 1000,
};

const start_http_service_scan_batch = async (batchedArgs) => {
  HttpXLogger.log("HttpX: Processing batched events:", batchedArgs.length);

  // Collect all unique service IDs and projects from batched arguments
  const projectServiceMap = new Map();

  for (const [{ project, service_ids }] of batchedArgs) {
    if (!projectServiceMap.has(project)) {
      projectServiceMap.set(project, new Set());
    }
    service_ids.forEach((id) => projectServiceMap.get(project).add(id));
  }

  // Process each project's services in bulk
  for (const [project, serviceIdSet] of projectServiceMap) {
    const service_ids = Array.from(serviceIdSet);

    HttpXLogger.log(
      "HttpX: New Services for project",
      project,
      ":",
      service_ids
    );

    // Get the service details
    const services = await PenPal.API.Services.GetMany(service_ids);

    // Filter for HTTP-capable services
    const network_services = services.filter(
      (service) =>
        service.port &&
        service.ip_protocol.toLowerCase() === "tcp" &&
        service.status === "open"
    );

    if (network_services.length > 0) {
      // Enrich services with host IP information
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

      // Perform HTTP enrichment scan
      await HttpX.performHttpScan({
        project_id: project,
        services: network_services,
      });
    }
  }
};

const HttpXPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();

    // Subscribe to new services discovered by other plugins (Nmap, Rustscan, etc.)
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Services,
      PenPal.Utils.BatchFunction(start_http_service_scan_batch, 5000)
    );

    // Register APIs on PenPal object
    PenPal.HttpX = {
      PerformScan: HttpX.performHttpScan,
      ParseResults: HttpX.parseAndUpsertResults,
    };

    // Register test handlers if Tester plugin is available
    if (PenPal.Tester && PenPal.Tester.RegisterHandler) {
      // Test handler for HTTP scanning
      PenPal.Tester.RegisterHandler(
        "HttpX",
        async () => {
          try {
            // Test basic HTTP scanning functionality
            const testServices = [
              {
                host_ip: "httpbin.org",
                port: 80,
                ip_protocol: "TCP",
                status: "open",
              },
            ];

            const result = await HttpX.performHttpScan({
              project_id: "test",
              services: testServices,
            });

            return {
              success: true,
              message: "HttpX scan completed successfully",
              timestamp: new Date().toISOString(),
              services_scanned: testServices.length,
              results_found: result?.length || 0,
            };
          } catch (error) {
            // Log full error details on server side
            HttpXLogger.error("HttpX Test failed:", error);
            HttpXLogger.error("Stack trace:", error.stack);

            return {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [],
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
            HttpXLogger.error("Docker Image Status check failed:", error);
            HttpXLogger.error("Stack trace:", error.stack);

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

      HttpXLogger.log("Registered test handlers with Tester plugin");
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
