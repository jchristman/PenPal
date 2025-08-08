import gowitness_enrichment_resolvers from "./gowitness-plugin-enrichment.default.js";
import configResolvers from "./gowitness.config.js";

export default {
  queries: { ...((configResolvers && configResolvers.queries) || {}) },
  mutations: { ...((configResolvers && configResolvers.mutations) || {}) },
  subscriptions: {},
  default_resolvers: [gowitness_enrichment_resolvers],
  scalars: [],
};
