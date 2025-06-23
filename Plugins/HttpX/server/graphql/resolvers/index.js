import httpx_plugin_enrichment_default_resolvers from "./httpx-plugin-enrichment.default.js";

export default {
  queries: {
    // No custom queries needed for now
  },
  mutations: {
    // No custom mutations needed for now
  },
  default_resolvers: [httpx_plugin_enrichment_default_resolvers],
  scalars: [],
};
