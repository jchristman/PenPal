import PenPal from "#penpal/core";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as Gowitness from "./gowitness.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// File-level logger that can be imported by other files
export const GowitnessLogger = PenPal.Utils.BuildLogger("Gowitness");

export const settings = {
  docker: {
    name: "penpal:gowitness",
    dockercontext: `${__dirname}/docker-context`,
  },
};

const start_gowitness_scan_batch = async (batchedArgs) => {
  GowitnessLogger.log(
    "Gowitness: Processing batched events:",
    batchedArgs.length
  );

  // Collect all unique HTTP services and projects from batched arguments
  const projectHttpServicesMap = new Map();

  for (const [{ project, http_services }] of batchedArgs) {
    if (!projectHttpServicesMap.has(project)) {
      projectHttpServicesMap.set(project, []);
    }
    projectHttpServicesMap.get(project).push(...http_services);
  }

  // Process each project's HTTP services in bulk
  for (const [project, http_services] of projectHttpServicesMap) {
    // Deduplicate HTTP services by URL
    const unique_services = http_services.filter(
      (service, index, array) =>
        array.findIndex((s) => s.url === service.url) === index
    );

    GowitnessLogger.log(
      `Gowitness: Processing ${unique_services.length} unique HTTP services for project ${project}`
    );

    if (unique_services.length > 0) {
      // Create a job for this screenshot scan
      const job = await PenPal.Jobs.Create({
        name: `Gowitness Screenshot Scan (${unique_services.length} HTTP services)`,
        plugin: "Gowitness",
        progress: 0,
        statusText: "Starting Gowitness screenshot scan...",
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
        // Perform Gowitness screenshot scan with job tracking
        await Gowitness.performScreenshotScan({
          project_id: project,
          http_services: unique_services,
          update_job,
        });
      } catch (error) {
        GowitnessLogger.error("Gowitness scan failed:", error);
        await update_job(
          100,
          `Gowitness scan failed: ${error.message}`,
          "failed"
        );
        throw error; // Re-throw so ScanQueue can mark its stage as failed
      }
    } else {
      // Create a job to explain why no scan was performed
      const job = await PenPal.Jobs.Create({
        name: `Gowitness Screenshot Scan (${http_services.length} services checked)`,
        plugin: "Gowitness",
        progress: 100,
        statusText: "Gowitness Scan Skipped - No valid HTTP services found",
        status: PenPal.Jobs.Status.DONE,
        project_id: project,
      });

      GowitnessLogger.log(
        `Gowitness scan skipped - no valid HTTP services found out of ${http_services.length} services checked`
      );
    }
  }
};

const BatchEnqueue = (BatchArgs) => {
  // Extract HTTP service count and project info for descriptive naming
  const totalHttpServices = BatchArgs.reduce(
    (sum, [{ http_services }]) => sum + http_services.length,
    0
  );
  const projects = [...new Set(BatchArgs.map(([{ project }]) => project))];
  const projectCount = projects.length;

  const queueName =
    projectCount === 1
      ? `Gowitness Screenshot Scan (${totalHttpServices} HTTP services, Project: ${projects[0]})`
      : `Gowitness Screenshot Scan (${totalHttpServices} HTTP services, ${projectCount} projects)`;

  PenPal.ScanQueue.Add(
    async () => await start_gowitness_scan_batch(BatchArgs),
    queueName
  );
};

const GowitnessPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();

    // Subscribe to HTTP services discovered by HttpX plugin
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.HTTPServices,
      PenPal.Utils.BatchFunction(BatchEnqueue, 2000) // 2 second batching as requested
    );

    // Register APIs on PenPal object
    PenPal.Gowitness = {
      PerformScan: Gowitness.performScreenshotScan,
      ParseResults: Gowitness.parseAndUploadScreenshots,
    };

    // Register test handlers if Tester plugin is available
    if (PenPal.Tester && PenPal.Tester.RegisterHandler) {
      // Test handler for Gowitness screenshot scanning
      PenPal.Tester.RegisterHandler(
        "Gowitness",
        async () => {
          try {
            // Test basic Gowitness scanning functionality
            const testHttpServices = [
              {
                host: "httpbin.org",
                port: 80,
                url: "http://httpbin.org:80",
                status_code: 200,
                title: "httpbin.org",
              },
            ];

            const result = await Gowitness.performScreenshotScan({
              project_id: "test",
              http_services: testHttpServices,
            });

            return {
              success: true,
              message: "Gowitness screenshot scan completed successfully",
              timestamp: new Date().toISOString(),
              services_scanned: testHttpServices.length,
              screenshots_captured: result?.screenshots_captured || 0,
            };
          } catch (error) {
            // Log full error details on server side
            GowitnessLogger.error("Gowitness Test failed:", error);
            GowitnessLogger.error("Stack trace:", error.stack);

            return {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [],
        "Screenshot Scanner"
      );

      // Test handler that checks if Gowitness Docker image is ready
      PenPal.Tester.RegisterHandler(
        "Gowitness",
        async () => {
          try {
            const isReady = PenPal.Docker.IsImageReady("penpal:gowitness");
            const isBuilding =
              PenPal.Docker.IsImageBuilding("penpal:gowitness");
            const isFailed = PenPal.Docker.IsImageFailed("penpal:gowitness");

            return {
              image_ready: isReady,
              image_building: isBuilding,
              image_failed: isFailed,
              timestamp: new Date().toISOString(),
              message: isReady
                ? "Gowitness Docker image is ready"
                : isBuilding
                ? "Gowitness Docker image is building"
                : isFailed
                ? "Gowitness Docker image build failed"
                : "Gowitness Docker image status unknown",
            };
          } catch (error) {
            return {
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [],
        "Docker Image Status"
      );

      GowitnessLogger.log("Registered test handlers with Tester plugin");
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

export default GowitnessPlugin;
