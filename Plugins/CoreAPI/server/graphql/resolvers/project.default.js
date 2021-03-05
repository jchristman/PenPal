import { CachingDefaultResolvers } from "./common.js";

export default {
  Project: {
    ...CachingDefaultResolvers("Projects", [
      "id",
      "customer",
      "name",
      "description",
      "dates",
      "scope"
    ])
  },

  ProjectScope: {
    // We pass thru the args here to the connection default resolvers so they can actually do the appropriate fetching
    async hostsConnection({ hosts }, args, { PenPalCachingAPI }) {
      return { hosts, args };
    },

    // We pass thru the args here to the connection default resolvers so they can actually do the appropriate fetching
    async networksConnection({ networks }, args, { PenPalCachingAPI }) {
      return { networks, args };
    }
  },

  ProjectsConnection: {
    async edges({ args = {} }, _, { PenPalCachingAPI }) {
      const projects = await PenPalCachingAPI.Project.GetMany([], args);
      return projects.map((project) => ({ cursor: project.id, node: project }));
      return result;
    },

    async projects({ args = {} }, _, { PenPalCachingAPI }) {
      const projects = await PenPalCachingAPI.Projects.GetMany([], args);
      return projects;
    },

    async pageInfo({ args = {} }, _, { PenPalCachingAPI }) {
      const {
        startCursor,
        startCursorOffset,
        endCursor,
        endCursorOffset,
        totalCount
      } = await PenPalCachingAPI.Projects.GetPaginationInfo([], args);

      return {
        hasPreviousPage: startCursorOffset > 0,
        hasNextPage: endCursorOffset < totalCount - 1,
        startCursor,
        startCursorOffset,
        endCursor,
        endCursorOffset
      };
    },

    async totalCount({ args = {} }, _, { PenPalCachingAPI }) {
      const { totalCount } = await PenPalCachingAPI.Projects.GetPaginationInfo(
        [],
        args
      );
      return totalCount;
    }
  }
};
