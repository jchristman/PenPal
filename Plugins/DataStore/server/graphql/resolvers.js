import resolvers from "./resolvers/";

export default [
  {
    Query: {
      ...resolvers.queries
    }
  }
];
