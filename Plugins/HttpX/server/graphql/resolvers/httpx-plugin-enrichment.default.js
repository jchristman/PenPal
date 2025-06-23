import PenPal from "#penpal/core";

const isHttpXPluginEnrichment = (obj) => {
  if (obj.plugin_name === "HttpX") {
    return "HttpXPluginEnrichment";
  }
  return null;
};

export default {
  PluginEnrichment: {
    __resolveType: isHttpXPluginEnrichment,
  },
  HttpXPluginEnrichment: {
    url(obj) {
      return obj.url;
    },
    status_code(obj) {
      return obj.status_code;
    },
    content_type(obj) {
      return obj.content_type;
    },
    content_length(obj) {
      return obj.content_length;
    },
    title(obj) {
      return obj.title;
    },
    server(obj) {
      return obj.server;
    },
    tech(obj) {
      return obj.tech;
    },
    method(obj) {
      return obj.method;
    },
    scheme(obj) {
      return obj.scheme;
    },
    path(obj) {
      return obj.path;
    },
  },
};
