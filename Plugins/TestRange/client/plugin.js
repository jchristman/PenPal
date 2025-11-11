import.meta.glob("./**/*.jsx", { eager: true });
import registerRoutes from "./routes.js";

const TestRangePlugin = {
  loadPlugin() {
    return {
      registerRoutes,
    };
  },
};

export default TestRangePlugin;