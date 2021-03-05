import PenPal from "meteor/penpal";

import registerRoutes from "./routes.js";

const BasePlugin = {
  loadPlugin() {
    return { registerRoutes };
  }
};

export default BasePlugin;
