import jobs_queries_resolvers from "./jobs.queries.js";
import jobs_mutations_resolvers from "./jobs.mutations.js";

export default {
  queries: {
    ...jobs_queries_resolvers,
  },
  mutations: {
    ...jobs_mutations_resolvers,
  },
  default_resolvers: [],
  scalars: [],
};
