import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as API from "./api/index.js";
import PenPal from "#penpal/core";

const settings = {
  datastores: [
    {
      name: "Jobs",
    },
  ],
};

const JobsTrackerPlugin = {
  async loadPlugin() {
    // Register Jobs API
    PenPal.Jobs = {
      Get: API.getJob,
      GetMany: API.getJobs,
      GetByPlugin: API.getJobsByPlugin,
      GetActive: API.getActiveJobs,
      GetByStatus: API.getJobsByStatus,
      Insert: API.insertJob,
      InsertMany: API.insertJobs,
      Update: API.updateJob,
      UpdateMany: API.updateJobs,
      UpdateStage: API.updateJobStage,
      Remove: API.removeJob,
      RemoveMany: API.removeJobs,
      Upsert: API.upsertJobs,
    };

    // Helper function to create a job with proper structure
    PenPal.Jobs.Create = async (jobData) => {
      const job = {
        id: jobData.id || PenPal.Utils.UUID(),
        name: jobData.name,
        plugin: jobData.plugin,
        progress: jobData.progress || 0.0,
        statusText: jobData.statusText || "",
        status: jobData.status || "pending",
        stages:
          jobData.stages?.map((stage) => ({
            id: stage.id || PenPal.Utils.UUID(),
            name: stage.name,
            plugin: stage.plugin || jobData.plugin,
            progress: stage.progress || 0.0,
            statusText: stage.statusText || "",
            status: stage.status || "pending",
            order: stage.order || 0,
            metadata: stage.metadata || {},
          })) || [],
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

export default JobsTrackerPlugin;
