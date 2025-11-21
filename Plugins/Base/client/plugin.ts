import type { PenPalPlugin } from "@penpal/types";
import.meta.glob("./**/*.jsx", { eager: true });
import registerRoutes from "./routes.ts";

const BasePlugin: PenPalPlugin = {
  async loadPlugin(): Promise<{ registerRoutes?: () => void }> {
    return { registerRoutes };
  },
};

export default BasePlugin;
