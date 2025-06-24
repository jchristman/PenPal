import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as API from "./api/index.js";
import PenPal from "#penpal/core";
import {
  JobStatus,
  COMPLETED_STATUSES,
  ACTIVE_STATUSES,
  validateStatus,
} from "../common/job-constants.js";

// File-level logger that can be imported by other files
export const JobsTrackerLogger = PenPal.Utils.BuildLogger("JobsTracker");

const settings = {
  datastores: [
    {
      name: "Jobs",
    },
  ],
};

const JobsTrackerPlugin = {
  cleanupInterval: null,

  async loadPlugin() {
    // Register Jobs API
    PenPal.Jobs = {
      // Status constants
      Status: JobStatus,
      CompletedStatuses: COMPLETED_STATUSES,
      ActiveStatuses: ACTIVE_STATUSES,

      // Core API methods
      Get: API.getJob,
      GetMany: API.getJobs,
      GetByPlugin: API.getJobsByPlugin,
      GetActive: API.getActiveJobs,
      GetByStatus: API.getJobsByStatus,
      Insert: API.insertJob,
      InsertMany: API.insertJobs,
      UpdateStage: API.updateJobStage,
      AddStage: API.addJobStage,
      Remove: API.removeJob,
      RemoveMany: API.removeJobs,
      Upsert: API.upsertJobs,
      CleanupStale: API.cleanupStaleJobs,

      // Manual cleanup trigger for debugging
      TriggerCleanup: async (timeoutMinutes = 5) => {
        JobsTrackerLogger.log("Manual cleanup triggered");
        return await API.cleanupStaleJobs(timeoutMinutes);
      },

      // Clear all jobs for debugging
      ClearAll: async () => {
        JobsTrackerLogger.log("Manual clear all jobs triggered");
        return await API.clearAllJobs();
      },
    };

    // Wrapped Update method with status validation
    PenPal.Jobs.Update = async (jobId, updates) => {
      if (updates.status) {
        validateStatus(updates.status);
      }
      return await API.updateJob(jobId, updates);
    };

    // Wrapped UpdateMany method with status validation
    PenPal.Jobs.UpdateMany = async (updatesArray, updateUpdatedAt = true) => {
      // Validate all statuses before updating
      for (const update of updatesArray) {
        if (update.status) {
          validateStatus(update.status);
        }
      }
      return await API.updateJobs(updatesArray, updateUpdatedAt);
    };

    // Helper function to create a job with proper structure
    PenPal.Jobs.Create = async (jobData) => {
      const defaultStatus = jobData.status || JobStatus.PENDING;
      validateStatus(defaultStatus);

      const job = {
        name: jobData.name,
        plugin: jobData.plugin,
        progress: jobData.progress || 0.0,
        statusText: jobData.statusText || "",
        status: defaultStatus,
        stages:
          jobData.stages?.map((stage) => {
            const stageStatus = stage.status || JobStatus.PENDING;
            validateStatus(stageStatus);
            return {
              name: stage.name,
              plugin: stage.plugin || jobData.plugin,
              progress: stage.progress || 0.0,
              statusText: stage.statusText || "",
              status: stageStatus,
              order: stage.order || 0,
              metadata: stage.metadata || {},
            };
          }) || [],
        project_id: jobData.project_id,
        metadata: jobData.metadata || {},
      };

      return await API.insertJob(job);
    };

    // Helper function to update job progress with stage-based calculation
    PenPal.Jobs.UpdateProgress = async (
      jobId,
      progress,
      statusText,
      currentStage = null
    ) => {
      const job = await API.getJob(jobId);
      if (!job) {
        throw new Error(`Job with id ${jobId} not found`);
      }

      const updates = { statusText };

      // Update current stage progress if specified
      if (currentStage !== null && job.stages && job.stages[currentStage]) {
        const updatedStages = job.stages.map((stage, index) =>
          index === currentStage ? { ...stage, progress, statusText } : stage
        );
        updates.stages = updatedStages;

        // Calculate overall job progress based on completed stages
        const totalStages = updatedStages.length;
        let completedStages = 0;
        let activeStageProgress = 0;
        let activeStageIndex = -1;

        // Count completed stages and find active stage
        for (let i = 0; i < updatedStages.length; i++) {
          if (updatedStages[i].progress >= 100) {
            completedStages++;
          } else if (updatedStages[i].progress > 0) {
            activeStageIndex = i;
            activeStageProgress = updatedStages[i].progress;
            break;
          }
        }

        // If no stage has progress yet but we have a current stage specified, use that
        if (
          activeStageIndex === -1 &&
          currentStage !== null &&
          currentStage >= 0
        ) {
          activeStageIndex = currentStage;
          activeStageProgress = progress;
        }

        // Calculate overall progress: each completed stage contributes equal weight
        const stageWeight = 100 / totalStages;
        const baseProgress = completedStages * stageWeight;
        const currentStageContribution =
          activeStageIndex >= 0 ? (activeStageProgress / 100) * stageWeight : 0;

        updates.progress = Math.min(
          100,
          baseProgress + currentStageContribution
        );
      } else {
        // No stages, direct progress update
        updates.progress = progress;
      }

      return await API.updateJob(jobId, updates);
    };

    // Start automatic cleanup of stale jobs
    this.startCleanupTimer();

    const types = await loadGraphQLFiles();

    return {
      graphql: {
        types,
        resolvers,
      },
      settings,
    };
  },

  startCleanupTimer() {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Set up periodeic cleanup every 5 minutes
    const cleanupIntervalMs = 5 * 60 * 1000; // 5 minutes

    JobsTrackerLogger.log("Starting automatic job cleanup (every 5 minutes)");

    this.cleanupInterval = setInterval(async () => {
      try {
        // Check if DataStore adapters are ready before attempting cleanup
        if (!PenPal.DataStore || !PenPal.DataStore.AdaptersReady()) {
          JobsTrackerLogger.log(
            "DataStore adapters not ready, skipping cleanup cycle"
          );
          return;
        }

        const result = await API.cleanupStaleJobs(5); // Clean up jobs older than 5 minutes
        if (result.cancelledCount > 0) {
          JobsTrackerLogger.log(
            `Cleanup cycle completed: ${result.cancelledCount} stale jobs cancelled`
          );
        }
      } catch (error) {
        JobsTrackerLogger.error("Error during automatic cleanup:", error);
      }
    }, cleanupIntervalMs);

    // Also run cleanup once immediately (with delay to allow adapters to be ready)
    setTimeout(async () => {
      try {
        JobsTrackerLogger.log("Running initial cleanup check");
        if (PenPal.DataStore && PenPal.DataStore.AdaptersReady()) {
          const result = await API.cleanupStaleJobs(5);
          if (result.cancelledCount > 0) {
            JobsTrackerLogger.log(
              `Initial cleanup: ${result.cancelledCount} stale jobs cancelled`
            );
          }
        } else {
          JobsTrackerLogger.log("DataStore not ready for initial cleanup");
        }
      } catch (error) {
        JobsTrackerLogger.error("Error during initial cleanup:", error);
      }
    }, 10000); // Wait 10 seconds for adapters to be ready
  },

  stopCleanupTimer() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      JobsTrackerLogger.log("Stopped automatic job cleanup");
    }
  },
};

export default JobsTrackerPlugin;
