import resolvers from "./resolvers/index.js";

export default [
  {
    Query: { ...resolvers.queries },
    Mutation: { ...resolvers.mutations },
  },
];
