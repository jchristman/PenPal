import configResolvers from "./nuclei.config.ts";

export default {
  queries: { ...((configResolvers && configResolvers.queries) || {}) },
  mutations: { ...((configResolvers && configResolvers.mutations) || {}) },
  default_resolvers: [],
  scalars: [],
};

