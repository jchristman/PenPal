import.meta.glob("./**/*.jsx", { eager: true });
import registerRoutes from "./routes.js";

const TesterPlugin = {
  loadPlugin() {
    return {
      registerRoutes,
    };
  },
};

export default TesterPlugin;
