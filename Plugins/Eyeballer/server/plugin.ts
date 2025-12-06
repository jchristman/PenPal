import PenPal from "#penpal/core";
import type { PenPalPlugin, PluginLoadResult } from "#penpal/common";
import { loadGraphQLFiles, resolvers } from "./graphql/index.ts";
import * as Eyeballer from "./eyeballer.ts";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// File-level logger that can be imported by other files
export const EyeballerLogger = PenPal.Utils.BuildLogger("Eyeballer");

interface Screenshot {
  screenshot_key: string;
  [key: string]: any;
}

interface BatchArgsItem {
  project: string;
  screenshots: Screenshot[];
}

interface BatchArgs extends Array<[BatchArgsItem]> {}

interface UpdateJobFunction {
  (progress: number, statusText: string, status?: string): Promise<void>;
}

export const settings = {
  docker: {
    name: "penpal:eyeballer",
    dockercontext: `${__dirname}/docker-context`,
  },
  datastores: [],
};

const start_eyeballer_classification_batch = async (batchedArgs: BatchArgs): Promise<void> => {
  EyeballerLogger.log(
    "Eyeballer: Processing batched events:",
    batchedArgs.length
  );

  // Collect all unique screenshots and projects from batched arguments
  const projectScreenshotsMap = new Map();

  for (const [{ project, screenshots }] of batchedArgs) {
    if (!projectScreenshotsMap.has(project)) {
      projectScreenshotsMap.set(project, []);
    }
    projectScreenshotsMap.get(project).push(...screenshots);
  }

  // Process each project's screenshots in bulk
  for (const [project, screenshots] of projectScreenshotsMap) {
    // Deduplicate screenshots by screenshot_key
    const unique_screenshots = screenshots.filter(
      (screenshot, index, array) =>
        array.findIndex((s) => s.screenshot_key === screenshot.screenshot_key) ===
        index
    );

    EyeballerLogger.log(
      `Eyeballer: Processing ${unique_screenshots.length} unique screenshots for project ${project}`
    );

    if (unique_screenshots.length > 0) {
      // Create a job for this classification batch
      const job = await PenPal.Jobs.Create({
        name: `Eyeballer Classification (${unique_screenshots.length} screenshots)`,
        plugin: "Eyeballer",
        progress: 0,
        statusText: "Starting Eyeballer classification...",
        project_id: project,
      });

      const update_job: UpdateJobFunction = async (progress, statusText, status = "running") => {
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
        // Perform Eyeballer classification with job tracking
        await Eyeballer.processScreenshotsBatch({
          project_id: project,
          screenshots: unique_screenshots,
          update_job,
        });
      } catch (error) {
        EyeballerLogger.error("Eyeballer classification failed:", error);
        await update_job(
          100,
          `Eyeballer classification failed: ${error.message}`,
          "failed"
        );
        throw error; // Re-throw so ScanQueue can mark its stage as failed
      }
    } else {
      // Create a job to explain why no classification was performed
      const job = await PenPal.Jobs.Create({
        name: `Eyeballer Classification (${screenshots.length} screenshots checked)`,
        plugin: "Eyeballer",
        progress: 100,
        statusText: "Eyeballer Classification Skipped - No valid screenshots found",
        status: PenPal.Jobs.Status.DONE,
        project_id: project,
      });

      EyeballerLogger.log(
        `Eyeballer classification skipped - no valid screenshots found out of ${screenshots.length} screenshots checked`
      );
    }
  }
};

const BatchEnqueue = (BatchArgs: BatchArgs): void => {
  // Extract screenshot count and project info for descriptive naming
  const totalScreenshots = BatchArgs.reduce(
    (sum, [{ screenshots }]) => sum + (screenshots?.length || 0),
    0
  );
  const projects = [...new Set(BatchArgs.map(([{ project }]) => project))];
  const projectCount = projects.length;

  const queueName =
    projectCount === 1
      ? `Eyeballer Classification (${totalScreenshots} screenshots, Project: ${projects[0]})`
      : `Eyeballer Classification (${totalScreenshots} screenshots, ${projectCount} projects)`;

  PenPal.ScanQueue.Add(
    async () => await start_eyeballer_classification_batch(BatchArgs),
    queueName
  );
};

const EyeballerPlugin: PenPalPlugin = {
  async loadPlugin(): Promise<PluginLoadResult> {
    const MQTT = await PenPal.MQTT.NewClient();

    // Subscribe to new screenshots from Gowitness plugin
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Screenshots,
      PenPal.Utils.BatchFunction(BatchEnqueue, 5000) // 5 second batching for classification
    );

    // Register APIs on PenPal object
    PenPal.Eyeballer = {
      ProcessScreenshot: Eyeballer.processScreenshot,
      ProcessScreenshotsBatch: Eyeballer.processScreenshotsBatch,
    };

    // Register test handlers if Tester plugin is available
    if (PenPal.Tester && PenPal.Tester.RegisterHandler) {
      // Test handler for Eyeballer classification
      PenPal.Tester.RegisterHandler(
        "Eyeballer",
        async () => {
          try {
            // Test basic Eyeballer classification functionality
            // This would require a test screenshot to be available
            return {
              success: true,
              message: "Eyeballer test handler registered",
              timestamp: new Date().toISOString(),
              note: "Actual classification requires a valid screenshot",
            };
          } catch (error) {
            EyeballerLogger.error("Eyeballer Test failed:", error);
            return {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            };
          }
        },
        [],
        "Screenshot Classifier"
      );

      // Test handler that checks if Eyeballer Docker image is ready
      PenPal.Tester.RegisterHandler(
        "Eyeballer",
        async () => {
          try {
            const isReady = PenPal.Docker.IsImageReady("penpal:eyeballer");
            const isBuilding =
              PenPal.Docker.IsImageBuilding("penpal:eyeballer");
            const isFailed = PenPal.Docker.IsImageFailed("penpal:eyeballer");

            return {
              image_ready: isReady,
              image_building: isBuilding,
              image_failed: isFailed,
              timestamp: new Date().toISOString(),
              message: isReady
                ? "Eyeballer Docker image is ready"
                : isBuilding
                ? "Eyeballer Docker image is building"
                : isFailed
                ? "Eyeballer Docker image build failed"
                : "Eyeballer Docker image status unknown",
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

      EyeballerLogger.log("Registered test handlers with Tester plugin");
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

export default EyeballerPlugin;

