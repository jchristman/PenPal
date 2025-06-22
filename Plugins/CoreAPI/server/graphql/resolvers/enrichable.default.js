import { CachingDefaultResolvers } from "./common.js";
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

      return result;
    },

    plugin_name(obj) {
      return obj.plugin_name;
    },
  },
};
