// will need resolvers and queries and mutations for handling configuration
import QueryResolvers from './queries';
import MutationResolvers from './mutations';

export default {
  queries: QueryResolvers,
  mutations: MutationResolvers,
  default_resolvers: [],
  scalars: []
};
