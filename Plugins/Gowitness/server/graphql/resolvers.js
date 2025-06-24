import resolvers from "./resolvers/index.js";

export default [
  {
    Query: { ...resolvers.queries },
    Mutation: { ...resolvers.mutations },
    Subscription: { ...resolvers.subscriptions },
  },
  ...resolvers.default_resolvers,
  ...resolvers.scalars,
];
