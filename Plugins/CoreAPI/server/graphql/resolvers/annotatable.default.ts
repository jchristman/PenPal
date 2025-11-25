export default {
  Annotatable: {
    __resolveType(obj, context, info) {
      switch (true) {
        case obj.customer !== undefined:
          return "Project";
        case obj.projects !== undefined:
          return "Customer";
        case network_address !== undefined:
          return "Network";
        case ip_address !== undefined:
          return "Host";
        default:
          return "Service";
      }
    }
  }
}
