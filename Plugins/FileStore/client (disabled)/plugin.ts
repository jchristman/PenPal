import type { PenPalPlugin } from "@penpal/types";
import.meta.glob("./**/*.{jsx,tsx}", { eager: true });
import registerRoutes from "./routes.ts";

const FileStorePlugin: PenPalPlugin = {
  async loadPlugin(): Promise<{ registerRoutes?: () => void }> {
    return {
      registerRoutes,
    };
  },
};

export default FileStorePlugin;
