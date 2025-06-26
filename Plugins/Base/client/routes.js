import { registerRoute } from "@penpal/core";

import { HomeIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

const registerRoutes = () => {
  const Dashboard = {
    name: "dashboard",
    path: "/",
    componentName: "Dashboard",
    prettyName: "Dashboard",
    icon: HomeIcon,
  };
  registerRoute(Dashboard);

  const Configuration = {
    name: "configuration",
    path: "/configure",
    componentName: "Configuration",
    prettyName: "Configure Plugins",
    icon: Cog6ToothIcon,
  };
  registerRoute(Configuration);
};

export default registerRoutes;
