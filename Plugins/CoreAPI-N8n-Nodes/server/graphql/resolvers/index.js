// import scalar_resolvers from "./scalars.js";
import query_resolvers from "./queries.js";
//import mutation_resolvers from "./mutations.js";

export default {
  queries: query_resolvers,
  mutations: {},
  default_resolvers: []
  // scalars: scalar_resolvers
};
