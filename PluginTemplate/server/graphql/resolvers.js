import resolvers from "./resolvers/index.js";

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
  ...resolvers.scalars,
];
