import resolvers from "./resolvers/index.ts";

const resolversArray: any[] = [
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

export default resolversArray;
