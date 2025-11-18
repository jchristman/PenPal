export default {
  getDomain: async (root, { id }, { PenPalCachingAPI }) => {
    if (!id) return null;
    return await PenPalCachingAPI.Domains.Get(id);
  },

  getDomains: async (root, { ids }, { PenPalCachingAPI }) => {
    return await PenPalCachingAPI.Domains.GetMany(ids || []);
  },

  getDomainsByProject: async (root, { projectId, first, after, last, before }, { PenPalCachingAPI }) => {
    const domains = await PenPalCachingAPI.Domains.GetManyByProjectID(projectId) || [];

    // Apply pagination if requested
    if (first || after || last || before) {
      // Simple pagination implementation
      let startIndex = 0;
      let endIndex = domains.length;

      if (after) {
        const afterIndex = domains.findIndex(d => d.id === after);
        if (afterIndex !== -1) {
          startIndex = afterIndex + 1;
        }
      }

      if (first) {
        endIndex = Math.min(startIndex + first, domains.length);
      }

      const edges = domains.slice(startIndex, endIndex).map(domain => ({
        node: domain,
        cursor: domain.id,
      }));

      return {
        edges,
        domains: edges.map(edge => edge.node),
        pageInfo: {
          hasNextPage: endIndex < domains.length,
          hasPreviousPage: startIndex > 0,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount: domains.length,
      };
    }

    return {
      edges: domains.map(domain => ({
        node: domain,
        cursor: domain.id,
      })),
      domains,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: domains.length > 0 ? domains[0].id : null,
        endCursor: domains.length > 0 ? domains[domains.length - 1].id : null,
      },
      totalCount: domains.length,
    };
  },
};
