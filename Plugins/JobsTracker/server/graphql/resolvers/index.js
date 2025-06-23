import jobs_queries_resolvers from "./jobs.queries.js";
import jobs_mutations_resolvers from "./jobs.mutations.js";
import jobs_subscriptions_resolvers from "./jobs.subscriptions.js";

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
