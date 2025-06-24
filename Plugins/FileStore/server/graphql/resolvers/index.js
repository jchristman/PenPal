import filestore_query_resolvers from "./filestore.queries.js";
import filestore_mutation_resolvers from "./filestore.mutations.js";
import filestore_scalar_resolvers from "./scalars.js";

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
