import nmap_plugin_enrichment_default_resolvers from "./nmap-plugin-enrichment.default.js";

export default {
  queries: {
    // ...analytics_query_resolvers,
  },
  mutations: {
    // ...analytics_mutation_resolvers,
  },
  default_resolvers: [nmap_plugin_enrichment_default_resolvers],
  //scalars: scalar_resolvers,
  scalars: [],
};
