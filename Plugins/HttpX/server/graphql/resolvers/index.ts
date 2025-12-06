import httpx_plugin_enrichment_default_resolvers from "./httpx-plugin-enrichment.default.ts";
import configResolvers from "./httpx.config.ts";

export default {
  queries: { ...((configResolvers && configResolvers.queries) || {}) },
  mutations: { ...((configResolvers && configResolvers.mutations) || {}) },
  default_resolvers: [httpx_plugin_enrichment_default_resolvers],
  scalars: [],
};
