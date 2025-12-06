import * as API from "../../api/index.js";

export default {
  invokeTestHandler: async (parent, { handler_id, args = [] }) => {
    try {
      const result = await API.invokeHandler(handler_id, args);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        invoked_at: new Date().toISOString(),
      };
    }
  },

  unregisterTestHandler: async (parent, { handler_id }) => {
    return API.unregisterHandler(handler_id);
  },

  clearPluginTestHandlers: async (parent, { plugin_name }) => {
    const cleared = API.clearPluginHandlers(plugin_name);
    return cleared.length;
  },
};
