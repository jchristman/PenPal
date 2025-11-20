import.meta.glob("./**/*.jsx", { eager: true });
import registerRoutes from "./routes.js";
import React from "react";
import PenPal, { Components, registerComponent } from "@penpal/core";
import { AutoReconButtons } from "./components/auto-recon-section.jsx";

const AutoReconPlugin = {
  loadPlugin() {
    // Register the AutoRecon button component for the project scope
    PenPal.registerProjectScopeButton({
      name: "AutoRecon",
      component: "AutoReconButtons",
      order: 10, // Position in the button list
    });

    return {
      registerRoutes,
    };
  },
};

export default AutoReconPlugin;
