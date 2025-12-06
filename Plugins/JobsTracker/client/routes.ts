import { registerRoute } from "@penpal/core";
import type { PenPalRoute } from "@penpal/types";
import WorkIcon from "@heroicons/react/24/outline/BriefcaseIcon";

const registerRoutes = (): void => {
  const jobs: PenPalRoute = {
    name: "jobs",
    path: "/jobs",
    componentName: "Jobs",
    prettyName: "Jobs",
    icon: WorkIcon,
  };
  registerRoute(jobs, 2);
};

export default registerRoutes;
