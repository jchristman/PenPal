import query_resolvers from "./queries.js";
import mutation_resolvers from "./mutations.js";

export default {
  queries: query_resolvers,
  mutations: mutation_resolvers,
  default_resolvers: []
};
