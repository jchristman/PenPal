import resolvers from "./resolvers/index.js";

export default [
  {
    Mutation: {
      ...resolvers.mutations,
    },
  },
];
