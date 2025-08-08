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

  const ConfigurationPlugin = {
    name: "configuration-plugin",
    path: "/configure/:plugin_name",
    componentName: "Configuration",
    prettyName: "Configure Plugin",
    icon: Cog6ToothIcon,
    hideFromNav: true,
  };
  registerRoute(ConfigurationPlugin);
};

export default registerRoutes;
