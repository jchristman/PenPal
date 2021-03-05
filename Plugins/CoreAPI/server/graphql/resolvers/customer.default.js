import { CachingDefaultResolvers } from "./common.js";

export default {
  Customer: {
    ...CachingDefaultResolvers("Customers", ["id", "name", "industry"]),

    async projectsConnection({ id }, args, { PenPalCachingAPI }) {
      const { projects = [] } = await PenPalCachingAPI.Customers.Get(id);
      return { projects, args };
    }
  }
};
