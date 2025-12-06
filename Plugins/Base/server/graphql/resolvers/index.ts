import plugins_queries_resolvers from "./plugins.queries.ts";
import plugins_default_resolvers from "./plugins.default.ts";
import profiles_queries from "./profiles.ts";
import { mutations as profiles_mutations } from "./profiles.ts";

export default {
  queries: {
    ...plugins_queries_resolvers,
    ...profiles_queries,
  },
  mutations: {
    ...profiles_mutations,
  },
  default_resolvers: [plugins_default_resolvers],
  scalars: [],
};
