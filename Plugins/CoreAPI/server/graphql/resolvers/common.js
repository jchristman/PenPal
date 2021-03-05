import _ from "lodash";

export const CachingDefaultResolvers = (API, Fields) => {
  const resolvers = {};

  for (let field of Fields) {
    resolvers[field] = async (root, __, { PenPalCachingAPI }) => {
      const id = typeof root === "string" ? root : root.id;
      return (await PenPalCachingAPI[API]?.Get(id))?.[field] ?? null;
    };
  }

  return resolvers;
};
