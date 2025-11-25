import { CachingDefaultResolvers } from "./common.ts";
import PenPal from "#penpal/core";

PenPal.Utils.RunAfterImport(() => {
  PenPal.API.InterfaceResolvers.PluginEnrichments = [];
});

export default {
  Enrichable: {
    __resolveType(obj, context, info) {
      switch (true) {
        case obj.network_address !== undefined:
          return "Network";
        case obj.ip_address !== undefined:
          return "Host";
        default:
          return "Service";
      }
    },
  },

  PluginEnrichment: {
    __resolveType(obj, context, info) {
      for (let resolver of PenPal.API.InterfaceResolvers.PluginEnrichments) {
        let result = resolver(obj, context, info);
        if (result) {
          return result;
        }
      }

      // Return null if no resolver matches
      return null;
    },

    plugin_name(obj) {
      return obj.plugin_name;
    },

    data(obj) {
      // Return all properties except plugin_name and files as the data object
      // (files is handled by its own resolver)
      const { plugin_name, files, ...data } = obj;
      return data;
    },

    files(obj) {
      // Files are stored directly in the enrichment object
      // Return them directly - no need for dynamic resolution
      return obj.files || [];
    },
  },
};
