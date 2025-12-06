import * as API from "../../api/index.js";

export default {
  getTestHandlers: async () => {
    return API.getRegisteredHandlers();
  },

  getTestHandler: async (parent, { handler_id }) => {
    const handler = API.getHandler(handler_id);
    if (!handler) {
      throw new Error(`Test handler with ID ${handler_id} not found`);
    }

    // Return handler info without the actual function
    return {
      id: handler.id,
      plugin_name: handler.plugin_name,
      handler_name: handler.handler_name,
      args_schema: handler.args_schema,
      registered_at: handler.registered_at,
    };
  },
};
