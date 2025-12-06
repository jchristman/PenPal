import autorecon_queries_resolvers from "./autorecon.queries.ts";
import autorecon_mutations_resolvers from "./autorecon.mutations.ts";
import autorecon_subscriptions_resolvers from "./autorecon.subscriptions.ts";
import autorecon_configuration_resolvers from "./autorecon.configuration.ts";

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
