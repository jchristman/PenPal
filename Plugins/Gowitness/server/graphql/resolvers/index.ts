import gowitness_enrichment_resolvers from "./gowitness-plugin-enrichment.default.ts";
import configResolvers from "./gowitness.config.ts";

export default {
  queries: { ...((configResolvers && configResolvers.queries) || {}) },
  mutations: { ...((configResolvers && configResolvers.mutations) || {}) },
  subscriptions: {},
  default_resolvers: [gowitness_enrichment_resolvers],
  scalars: [],
};
