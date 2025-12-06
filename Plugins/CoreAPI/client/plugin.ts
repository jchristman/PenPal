import type { PenPalPlugin } from "@penpal/types";
import.meta.glob("./**/*.{jsx,tsx}", { eager: true });

// Explicitly import domains components to ensure they're loaded
import "./pages/project-view/project-view-domains.jsx";
import "./pages/project-view/project-view-domains-dashboard.jsx";
import "./pages/project-view/project-view-domains-table.jsx";
import "./pages/project-view/project-view-domains-graph.jsx";

import registerRoutes from "./routes.ts";

const CoreAPIPlugin: PenPalPlugin = {
  async loadPlugin(): Promise<{ registerRoutes?: () => void }> {
    return {
      registerRoutes,
    };
  },
};

export default CoreAPIPlugin;
