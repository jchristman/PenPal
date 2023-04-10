import resolvers from "./resolvers/";
import PenPal from "PenPal";

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
