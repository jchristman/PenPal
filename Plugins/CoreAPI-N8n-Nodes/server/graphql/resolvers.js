import resolvers from "./resolvers/index.js";
import PenPal from "#penpal/core";

export default [
  {
    Query: {
      ...resolvers.queries,
    },
  },
  {
    Mutation: {
      ...resolvers.mutations,
    },
  },
  ...resolvers.default_resolvers,
];
