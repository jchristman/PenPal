import { registerRoute } from "@penpal/core";

import WorkIcon from "@heroicons/react/24/outline/BriefcaseIcon";

const registerRoutes = () => {
  const jobs = {
    name: "jobs",
    path: "/jobs",
    componentName: "Jobs",
    prettyName: "Jobs",
    icon: WorkIcon,
  };
  registerRoute(jobs, 2);
};

export default registerRoutes;
