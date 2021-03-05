import PenPal from "meteor/penpal";

export default {
  Service: {
    __resolveType(obj, context, info) {
      switch (true) {
        case obj.ip_protocol !== undefined:
          return "NetworkService";
      }
    }
  },

  ServicesConnection: {
    async edges({ services: service_ids, args = {} }, _, { PenPalCachingAPI }) {
      const services = await PenPalCachingAPI.Services.GetMany(
        service_ids,
        args
      );
      return services.map((service) => ({ cursor: service.id, node: service }));
      return result;
    },

    async services(
      { services: service_ids, args = {} },
      _,
      { PenPalCachingAPI }
    ) {
      const services = await PenPalCachingAPI.Services.GetMany(
        service_ids,
        args
      );
      return services;
    },

    async pageInfo(
      { services: service_ids, args = {} },
      _,
      { PenPalCachingAPI }
    ) {
      const {
        startCursor,
        startCursorOffset,
        endCursor,
        endCursorOffset,
        totalCount
      } = await PenPalCachingAPI.Services.GetPaginationInfo(service_ids, args);

      return {
        hasPreviousPage: startCursorOffset > 0,
        hasNextPage: endCursorOffset < totalCount - 1,
        startCursor,
        startCursorOffset,
        endCursor,
        endCursorOffset
      };
    },

    async totalCount(
      { services: service_ids, args = {} },
      _,
      { PenPalCachingAPI }
    ) {
      const { totalCount } = await PenPalCachingAPI.Services.GetPaginationInfo(
        service_ids,
        args
      );
      return totalCount;
    }
  }
};
