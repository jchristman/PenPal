import jobs_queries_resolvers from "./jobs.queries.ts";
import jobs_mutations_resolvers from "./jobs.mutations.ts";
import jobs_subscriptions_resolvers from "./jobs.subscriptions.ts";

export default {
  queries: {
    ...jobs_queries_resolvers,
  },
  mutations: {
    ...jobs_mutations_resolvers,
  },
  subscriptions: {
    ...jobs_subscriptions_resolvers,
  },
  default_resolvers: [],
  scalars: [],
};
