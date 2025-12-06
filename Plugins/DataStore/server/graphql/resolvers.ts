import resolvers from "./resolvers/index.ts";

const resolversArray: any[] = [
  {
    Query: {
      ...resolvers.queries,
    },
  },
];

export default resolversArray;
