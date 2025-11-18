import.meta.glob("./**/*.jsx", { eager: true });
import registerRoutes from "./routes.js";
import React from "react";
import PenPal, { Components } from "@penpal/core";
import AutoReconSection from "./components/auto-recon-section.jsx";

const AutoReconPlugin = {
  loadPlugin() {
    // AutoRecon functionality is now integrated into the main scope UI
    // No longer registering as a separate section

    return {
      registerRoutes,
    };
  },
};

export default AutoReconPlugin;
