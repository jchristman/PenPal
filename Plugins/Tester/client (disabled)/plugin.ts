// @ts-nocheck
import.meta.glob("./**/*.tsx", { eager: true });
import registerRoutes from "./routes.ts";

const TesterPlugin = {
  loadPlugin() {
    return {
      registerRoutes,
    };
  },
};

export default TesterPlugin;
