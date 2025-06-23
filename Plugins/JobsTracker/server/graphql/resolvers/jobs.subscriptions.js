import * as API from "../../api/index.js";

export default {
  jobUpdated: {
    subscribe: (parent, args, context) => {
      if (!context?.pubsub) {
        throw new Error("PubSub not available in subscription context");
      }
      return context.pubsub.asyncIterator(["JOB_UPDATED"]);
    },
  },

  jobCreated: {
    subscribe: (parent, args, context) => {
      if (!context?.pubsub) {
        throw new Error("PubSub not available in subscription context");
      }
      return context.pubsub.asyncIterator(["JOB_CREATED"]);
    },
  },

  jobDeleted: {
    subscribe: (parent, args, context) => {
      if (!context?.pubsub) {
        throw new Error("PubSub not available in subscription context");
      }
      return context.pubsub.asyncIterator(["JOB_DELETED"]);
    },
  },

  activeJobsChanged: {
    subscribe: (parent, args, context) => {
      if (!context?.pubsub) {
        throw new Error("PubSub not available in subscription context");
      }
      return context.pubsub.asyncIterator(["ACTIVE_JOBS_CHANGED"]);
    },
  },
};
