import.meta.glob("./**/*.jsx", { eager: true });
import registerRoutes from "./routes.js";

const REPLACE_MEPlugin = {
  loadPlugin() {
    return { registerRoutes };
  },
};

export default REPLACE_MEPlugin;
