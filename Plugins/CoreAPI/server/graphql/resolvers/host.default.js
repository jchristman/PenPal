import { CachingDefaultResolvers } from "./common.js";

export default {
  Host: {
    ...CachingDefaultResolvers("Hosts", [
      "id",
      "project",
      "network",
      "ip_address",
      "mac_address",
      "hostnames"
    ]),

    async servicesConnection({ id }, args, { PenPalCachingAPI }) {
      const host = await PenPalCachingAPI.Hosts.Get(id);
      return { services: host.services, args };
    }
  },

  HostsConnection: {
    async edges({ hosts: host_ids, args = {} }, _, { PenPalCachingAPI }) {
      const hosts = await PenPalCachingAPI.Hosts.GetMany(host_ids, args);
      return hosts.map((host) => ({ cursor: host.id, node: host }));
      return result;
    },

    async hosts({ hosts: host_ids, args = {} }, _, { PenPalCachingAPI }) {
      const hosts = await PenPalCachingAPI.Hosts.GetMany(host_ids, args);
      return hosts;
    },

    async servicesConnection({ hosts: host_ids }, _, { PenPalCachingAPI }) {
      // TODO: This is possibly terribly inefficient, but it works for now
      const services = (
        await PenPalCachingAPI.Services.GetManyByHostIDs(host_ids)
      ).map((service) => service.id);
      return { services };
    },

    async pageInfo({ hosts: host_ids, args = {} }, _, { PenPalCachingAPI }) {
      const {
        startCursor,
        startCursorOffset,
        endCursor,
        endCursorOffset,
        totalCount
      } = await PenPalCachingAPI.Hosts.GetPaginationInfo(host_ids, args);

      return {
        hasPreviousPage: startCursorOffset > 0,
        hasNextPage: endCursorOffset < totalCount - 1,
        startCursor,
        startCursorOffset,
        endCursor,
        endCursorOffset
      };
    },

    async totalCount({ hosts: host_ids, args = {} }, _, { PenPalCachingAPI }) {
      const { totalCount } = await PenPalCachingAPI.Hosts.GetPaginationInfo(
        host_ids,
        args
      );
      return totalCount;
    }
  }
};
