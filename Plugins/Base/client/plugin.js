import PenPal from "@penpal/core";

import registerRoutes from "./routes.js";

const BasePlugin = {
  loadPlugin() {
    return { registerRoutes };
  },
};

export default BasePlugin;
