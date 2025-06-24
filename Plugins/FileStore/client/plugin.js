import.meta.glob("./**/*.jsx", { eager: true });
import registerRoutes from "./routes.js";

const FileStorePlugin = {
  loadPlugin() {
    return {
      registerRoutes,
    };
  },
};

export default FileStorePlugin;
