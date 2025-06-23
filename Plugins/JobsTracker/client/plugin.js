import.meta.glob("./**/*.jsx", { eager: true });
import registerRoutes from "./routes.js";

const JobsTrackerPlugin = {
  loadPlugin() {
    return {
      registerRoutes,
    };
  },
};

export default JobsTrackerPlugin;
