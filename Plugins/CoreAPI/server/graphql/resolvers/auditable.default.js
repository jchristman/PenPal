export default {
  Auditable: {
    __resolveType(obj, context, info) {
      switch (true) {
        case obj.customer !== undefined:
          return "Project";
        case obj.projects !== undefined:
          return "Customer";
        case obj.network_address !== undefined:
          return "Network";
        case obj.ip_address !== undefined:
          return "Host";
        default:
          return "Service";
      }
    },
  },
};
