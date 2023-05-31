import.meta.glob("./**/*.jsx", { eager: true });
import registerRoutes from "./routes.js";

const BasePlugin = {
  loadPlugin() {
    return { registerRoutes };
  },
};

export default BasePlugin;
