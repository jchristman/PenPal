import { registerRoute } from "@penpal/core";

import WorkIcon from "@mui/icons-material/Work";

const registerRoutes = () => {
  const jobs = {
    name: "jobs",
    path: "/jobs",
    componentName: "JobsPage",
    prettyName: "Jobs",
    icon: WorkIcon,
  };
  registerRoute(jobs);
};

export default registerRoutes;
