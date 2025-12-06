import * as API from "../../api/index.js";
import PenPal from "#penpal/core";

// Import the shared logger from plugin.js
import { JobsTrackerLogger as logger } from "../../plugin.js";

export default {
  jobUpdated: {
    subscribe: (parent, args, context) => {
      if (!context?.pubsub) {
        const error = new Error("PubSub not available in subscription context");
        logger.error("jobUpdated subscription error:", error.message);
        throw error;
      }
      logger.log("jobUpdated subscription started");
      return context.pubsub.asyncIterator(["JOB_UPDATED"]);
    },
    resolve: (payload) => {
      try {
        // Validate the payload before returning
        const job = payload.jobUpdated;
        if (!job) {
          logger.error("jobUpdated subscription received null/undefined job");
          return null;
        }

        // Validate required fields
        if (!job.name) {
          logger.error(
            "jobUpdated subscription: job missing required 'name' field:",
            job
          );
          return null;
        }

        if (!job.statusText && job.statusText !== "") {
          logger.error(
            "jobUpdated subscription: job missing required 'statusText' field:",
            job
          );
          return null;
        }

        return job;
      } catch (error) {
        logger.error(
          "jobUpdated subscription resolve error:",
          error.message,
          payload
        );
        return null;
      }
    },
  },

  jobCreated: {
    subscribe: (parent, args, context) => {
      if (!context?.pubsub) {
        const error = new Error("PubSub not available in subscription context");
        logger.error("jobCreated subscription error:", error.message);
        throw error;
      }
      logger.log("jobCreated subscription started");
      return context.pubsub.asyncIterator(["JOB_CREATED"]);
    },
    resolve: (payload) => {
      try {
        // Validate the payload before returning
        const job = payload.jobCreated;
        if (!job) {
          logger.error("jobCreated subscription received null/undefined job");
          return null;
        }

        // Validate required fields
        if (!job.name) {
          logger.error(
            "jobCreated subscription: job missing required 'name' field:",
            job
          );
          return null;
        }

        if (!job.statusText && job.statusText !== "") {
          logger.error(
            "jobCreated subscription: job missing required 'statusText' field:",
            job
          );
          return null;
        }

        return job;
      } catch (error) {
        logger.error(
          "jobCreated subscription resolve error:",
          error.message,
          payload
        );
        return null;
      }
    },
  },

  jobDeleted: {
    subscribe: (parent, args, context) => {
      if (!context?.pubsub) {
        const error = new Error("PubSub not available in subscription context");
        logger.error("jobDeleted subscription error:", error.message);
        throw error;
      }
      return context.pubsub.asyncIterator(["JOB_DELETED"]);
    },
  },

  activeJobsChanged: {
    subscribe: (parent, args, context) => {
      if (!context?.pubsub) {
        const error = new Error("PubSub not available in subscription context");
        logger.error("activeJobsChanged subscription error:", error.message);
        throw error;
      }
      return context.pubsub.asyncIterator(["ACTIVE_JOBS_CHANGED"]);
    },
    resolve: (payload) => {
      try {
        // Validate the payload before returning
        const jobs = payload.activeJobsChanged;
        if (!Array.isArray(jobs)) {
          logger.error(
            "activeJobsChanged subscription received non-array jobs:",
            typeof jobs
          );
          return [];
        }

        // Filter out any jobs with missing required fields
        const validJobs = jobs.filter((job) => {
          if (!job) {
            logger.error(
              "activeJobsChanged subscription: found null/undefined job in array"
            );
            return false;
          }

          if (!job.name) {
            logger.error(
              "activeJobsChanged subscription: job missing required 'name' field:",
              job
            );
            return false;
          }

          if (!job.statusText && job.statusText !== "") {
            logger.error(
              "activeJobsChanged subscription: job missing required 'statusText' field:",
              job
            );
            return false;
          }

          return true;
        });

        if (validJobs.length !== jobs.length) {
          logger.warn(
            `activeJobsChanged subscription: filtered out ${
              jobs.length - validJobs.length
            } invalid jobs`
          );
        }

        return validJobs;
      } catch (error) {
        logger.error(
          "activeJobsChanged subscription resolve error:",
          error.message,
          payload
        );
        return [];
      }
    },
  },
};
