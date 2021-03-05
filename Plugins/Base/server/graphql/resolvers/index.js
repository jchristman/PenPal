import plugins_queries_resolvers from "./plugins.queries.js";
import plugins_default_resolvers from "./plugins.default.js";

export default {
  queries: {
    ...plugins_queries_resolvers
  },
  mutations: {},
  default_resolvers: [plugins_default_resolvers],
  scalars: []
};
