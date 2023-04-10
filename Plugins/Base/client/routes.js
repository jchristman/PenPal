import { registerRoute } from "PenPal";

import HomeIcon from "@mui/icons-material/Home";
import SettingsInputSvideoIcon from "@mui/icons-material/SettingsInputSvideo";

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
};

export default registerRoutes;
