import nmap_plugin_enrichment_default_resolvers from "./nmap-plugin-enrichment.default.js";
import config_resolvers from "./nmap.config.js";

export default {
  queries: {
    ...config_resolvers.queries,
  },
  mutations: {
    ...config_resolvers.mutations,
  },
  default_resolvers: [nmap_plugin_enrichment_default_resolvers],
  //scalars: scalar_resolvers,
  scalars: [],
};
