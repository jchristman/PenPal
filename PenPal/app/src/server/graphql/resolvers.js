import resolvers from "./resolvers/";

export default [
  {
    Query: {
      ...resolvers.queries
    }
  },
  {
    Mutation: {
      ...resolvers.mutations
    }
  },
  ...resolvers.default_resolvers,
  ...resolvers.scalars
];
