// will need resolvers and queries and mutations for handling configuration
import QueryResolvers from "./queries.js";
import MutationResolvers from "./mutations.js";

export default {
  queries: QueryResolvers,
  mutations: MutationResolvers,
  default_resolvers: [],
  scalars: [],
};
