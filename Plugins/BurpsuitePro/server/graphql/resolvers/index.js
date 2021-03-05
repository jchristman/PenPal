import configuration_mutations_resolvers from "./configuration.mutations.js";
import configuration_queries_resolvers from "./configuration.queries.js";
import scalar_resolvers from "./scalars.js";

export default {
  queries: {
    ...configuration_queries_resolvers
  },
  mutations: {
    ...configuration_mutations_resolvers
  },
  default_resolvers: [],
  scalars: scalar_resolvers
};
