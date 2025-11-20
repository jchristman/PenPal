import PenPal from "#penpal/core";

export default {
  autoReconScanUpdated: {
    subscribe: (parent, { projectId }, { pubsub }) => {
      if (!pubsub) {
        throw new Error("PubSub not available in subscription context");
      }
      return pubsub.asyncIterator([`AUTORECON_SCAN_UPDATED:${projectId}`]);
    },
    resolve: (payload) => {
      // Return the scan data directly
      return payload.autoReconScanUpdated;
    },
  },
};
