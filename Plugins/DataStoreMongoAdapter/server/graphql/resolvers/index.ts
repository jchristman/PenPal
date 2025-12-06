// will need resolvers and queries and mutations for handling configuration
import QueryResolvers from "./queries.ts";
import MutationResolvers from "./mutations.ts";

export default {
  queries: QueryResolvers,
  mutations: MutationResolvers,
  default_resolvers: [],
  scalars: [],
};
