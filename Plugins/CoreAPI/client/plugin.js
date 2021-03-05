import registerRoutes from "./routes.js";

const CoreAPIPlugin = {
  loadPlugin() {
    return {
      registerRoutes
    };
  }
};

export default CoreAPIPlugin;
