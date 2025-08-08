import typeDefs from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";

const loadGraphQLFiles = async () => {
  return [typeDefs];
};

export { loadGraphQLFiles, resolvers };
