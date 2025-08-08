import scalar_resolvers from "./scalars.js";
import webapp_mutation_resolvers from "./webapp.mutations.js";
import webapp_query_resolvers from "./webapp.queries.js";
import webapp_users_default_resolvers from "./webapp.default.js";

export default {
  queries: {
    ...webapp_query_resolvers
  },
  mutations: {
    ...webapp_mutation_resolvers
  },
  default_resolvers: [webapp_users_default_resolvers],
  scalars: scalar_resolvers
};
