import resolvers from "./resolvers/";

export default [
  {
    Mutation: {
      ...resolvers.mutations,
    },
  },
];
