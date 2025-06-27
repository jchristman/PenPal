import.meta.glob("./**/*.jsx", { eager: true });
import registerRoutes from "./routes.js";
import PenPal, { Components } from "@penpal/core";

const JobsTrackerPlugin = {
  async loadPlugin() {
    PenPal.registerBadge({
      component: Components.JobsCounter,
      order: 100,
    });

    return {
      registerRoutes,
    };
  },
};

export default JobsTrackerPlugin;
