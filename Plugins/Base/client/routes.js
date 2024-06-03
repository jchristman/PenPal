import { registerRoute } from "@penpal/core";

import HomeIcon from "@mui/icons-material/Home";
import SettingsInputSvideoIcon from "@mui/icons-material/SettingsInputSvideo";
import AutorenewIcon from "@mui/icons-material/Autorenew";

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
    icon: SettingsInputSvideoIcon,
  };
  registerRoute(Configuration);

  const Jobs = {
    name: "jobs",
    path: "/jobs",
    componentName: "Jobs",
    prettyName: "Jobs",
    icon: AutorenewIcon,
  };
  registerRoute(Jobs);
};

export default registerRoutes;
