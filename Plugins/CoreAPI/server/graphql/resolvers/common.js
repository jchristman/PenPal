import PenPal from "#penpal/core";

export const CachingDefaultResolvers = (API, Fields) => {
  const resolvers = {};

  for (let field of Fields) {
    resolvers[field] = async (root, __, { PenPalCachingAPI }) => {
      const id = typeof root === "string" ? root : root.id;
      const record = await PenPalCachingAPI[API]?.Get(id);
      return record?.[field] ?? null;
    };
  }

  return resolvers;
};

PenPal.Utils.RunAfterImport(() => {
  PenPal.API.Utils = {};
  PenPal.API.Utils.CachingDefaultResolvers = CachingDefaultResolvers;
});
