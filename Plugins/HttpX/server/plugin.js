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

    HttpXLogger.log(`Retrieved ${services.length} services for analysis`);

    // Filter for HTTP-capable services
    const network_services = services.filter(
      (service) =>
        service.port &&
        service.ip_protocol.toLowerCase() === "tcp" &&
        service.status === "open"
    );

    if (network_services.length > 0) {
      // Create a job for this HTTP scan
      const job = await PenPal.Jobs.Create({
        name: `HTTP Discovery Scan (${network_services.length} services)`,
        plugin: "HttpX",
        progress: 0,
        statusText: "Starting HTTP discovery scan...",
        project_id: project,
      });

      const update_job = async (progress, statusText, status = "running") => {
        await PenPal.Jobs.Update(job.id, {
          progress,
          statusText,
          status:
            status === "failed"
              ? PenPal.Jobs.Status.FAILED
              : progress === 100
              ? PenPal.Jobs.Status.DONE
              : PenPal.Jobs.Status.RUNNING,
        });
      };

      try {
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

        // Perform HTTP enrichment scan with job tracking
        await HttpX.performHttpScan({
          project_id: project,
          services: network_services,
          update_job,
        });
      } catch (error) {
        HttpXLogger.error("HTTP scan failed:", error);
        await update_job(100, `HTTP scan failed: ${error.message}`, "failed");
        throw error; // Re-throw so ScanQueue can mark its stage as failed
      }
    } else {
      // Create a job to explain why no scan was performed
      const job = await PenPal.Jobs.Create({
        name: `HTTP Discovery Scan (${services.length} services checked)`,
        plugin: "HttpX",
        progress: 100,
        statusText: "HttpX Scan Skipped - No HTTP-capable services found",
        status: PenPal.Jobs.Status.DONE,
        project_id: project,
      });

      HttpXLogger.log(
        `HttpX scan skipped - no HTTP-capable services found out of ${services.length} services checked`
      );
    }
  }
};

const BatchEnqueue = (BatchArgs) => {
  // Extract service count and project info for descriptive naming
  const totalServices = BatchArgs.reduce(
    (sum, [{ service_ids }]) => sum + service_ids.length,
    0
  );
  const projects = [...new Set(BatchArgs.map(([{ project }]) => project))];
  const projectCount = projects.length;

  const queueName =
    projectCount === 1
      ? `HttpX Scan (${totalServices} services, Project: ${projects[0]})`
      : `HttpX Scan (${totalServices} services, ${projectCount} projects)`;

  PenPal.ScanQueue.Add(
    async () => await start_http_service_scan_batch(BatchArgs),
    queueName
  );
};

const HttpXPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();

    // Define HttpX-specific MQTT topics
    PenPal.API.MQTT.Topics.New.HTTPServices = "penpal/httpx/new/http-services";

    // Subscribe to new services discovered by other plugins (Nmap, Rustscan, etc.)
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Services,
      PenPal.Utils.BatchFunction(BatchEnqueue, 1000)
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
