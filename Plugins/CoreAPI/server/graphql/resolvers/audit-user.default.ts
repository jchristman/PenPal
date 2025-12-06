export default {
  AuditUser: {
    __resolveType(obj, context, info) {
      switch (true) {
        case obj.settings !== undefined:
          return "WebappUser";
        default:
          return "PluginUser";
      }
    }
  }
};
