import type { PenPalPlugin, PenPalProjectScopeButton } from "@penpal/types";
import.meta.glob("./**/*.{jsx,tsx}", { eager: true });
import registerRoutes from "./routes.ts";
import PenPal from "@penpal/core";

const AutoReconPlugin: PenPalPlugin = {
  async loadPlugin(): Promise<{ registerRoutes?: () => void }> {
    // Register the AutoRecon button component for the project scope
    PenPal.registerProjectScopeButton({
      name: "AutoRecon",
      component: "AutoReconButtons",
      order: 10, // Position in the button list
    } as PenPalProjectScopeButton);

    return {
      registerRoutes,
    };
  },
};

export default AutoReconPlugin;
