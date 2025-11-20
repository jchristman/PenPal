import.meta.glob("./**/*.jsx", { eager: true });

// Explicitly import domains components to ensure they're loaded
import "./pages/project-view/project-view-domains.jsx";
import "./pages/project-view/project-view-domains-dashboard.jsx";
import "./pages/project-view/project-view-domains-table.jsx";
import "./pages/project-view/project-view-domains-graph.jsx";

import registerRoutes from "./routes.js";

const CoreAPIPlugin = {
  loadPlugin() {
    return {
      registerRoutes,
    };
  },
};

export default CoreAPIPlugin;
