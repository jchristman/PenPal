import PenPal from "#penpal/core";

export default {
  autoReconScanUpdated: {
    subscribe: (_parent: any, { projectId }: { projectId: string }, { pubsub }: { pubsub: any }) => {
      if (!pubsub) {
        throw new Error("PubSub not available in subscription context");
      }
      return pubsub.asyncIterator([`AUTORECON_SCAN_UPDATED:${projectId}`]);
    },
    resolve: (payload: any) => {
      // Return the scan data directly
      return payload.autoReconScanUpdated;
    },
  },
};
