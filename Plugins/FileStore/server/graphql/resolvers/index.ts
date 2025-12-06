import filestore_query_resolvers from "./filestore.queries.ts";
import filestore_mutation_resolvers from "./filestore.mutations.ts";
import filestore_scalar_resolvers from "./scalars.ts";

export default {
  queries: {
    ...filestore_query_resolvers,
  },
  mutations: {
    ...filestore_mutation_resolvers,
  },
  default_resolvers: [],
  scalars: filestore_scalar_resolvers,
};
