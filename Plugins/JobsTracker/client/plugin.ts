import type { PenPalPlugin, PenPalProjectScopeButton } from "@penpal/types";
import.meta.glob("./**/*.{jsx,tsx}", { eager: true });
import registerRoutes from "./routes.ts";
import React from "react";
import PenPal, { Components } from "@penpal/core";

const JobsTrackerPlugin: PenPalPlugin = {
  async loadPlugin(): Promise<{ registerRoutes?: () => void }> {
    PenPal.registerBadge({
      component: Components.JobsCounter,
      order: 100,
    });

    // Register a Project tab via CoreAPI Project View Tabs API (if available)
    if (PenPal.API && typeof PenPal.API.registerProjectViewTab === "function") {
      PenPal.API.registerProjectViewTab({
        value: "jobs",
        label: "Jobs",
        order: 90,
        render: ({ project, Components }: { project: any; Components: any }) =>
          React.createElement(Components.ProjectJobsTab, { project }),
      });
    }

    return {
      registerRoutes,
    };
  },
};

export default JobsTrackerPlugin;
