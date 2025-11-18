import autorecon_queries_resolvers from "./autorecon.queries.js";
import autorecon_mutations_resolvers from "./autorecon.mutations.js";
import autorecon_subscriptions_resolvers from "./autorecon.subscriptions.js";
import autorecon_configuration_resolvers from "./autorecon.configuration.js";

export default {
  queries: {
    ...autorecon_queries_resolvers,
    ...autorecon_configuration_resolvers.queries,
  },
  mutations: {
    ...autorecon_mutations_resolvers,
    ...autorecon_configuration_resolvers.mutations,
  },
  subscriptions: {
    ...autorecon_subscriptions_resolvers,
  },
  default_resolvers: [],
  scalars: [],
};
