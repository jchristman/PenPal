import resolvers from "./resolvers/";
import PenPal from "meteor/penpal";

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
  ...resolvers.default_resolvers
];
