import configResolvers from "./nuclei.config.js";

export default {
  queries: { ...((configResolvers && configResolvers.queries) || {}) },
  mutations: { ...((configResolvers && configResolvers.mutations) || {}) },
  default_resolvers: [],
  scalars: [],
};

