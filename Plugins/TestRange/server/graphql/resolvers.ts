import resolvers from "./resolvers/index.ts";

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
  ...resolvers.default_resolvers || [],
  ...resolvers.scalars || [],
];

