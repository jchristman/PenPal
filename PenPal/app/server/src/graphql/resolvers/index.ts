import scalar_resolvers from "./scalars";
import webapp_mutation_resolvers from "./webapp.mutations";
import webapp_query_resolvers from "./webapp.queries";
import webapp_users_default_resolvers from "./webapp.default";

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
