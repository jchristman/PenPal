import plugins_queries_resolvers from "./plugins.queries.js";
import plugins_default_resolvers from "./plugins.default.js";
import profiles_queries from "./profiles.js";
import { mutations as profiles_mutations } from "./profiles.js";

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
