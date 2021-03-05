import { registerRoute } from "meteor/penpal";

import HomeIcon from "@material-ui/icons/Home";
import SettingsInputSvideoIcon from "@material-ui/icons/SettingsInputSvideo";

const registerRoutes = () => {
  const Dashboard = {
    name: "dashboard",
    path: "/",
    componentName: "Dashboard",
    prettyName: "Dashboard",
    icon: HomeIcon
  };
  registerRoute(Dashboard);

  const Configuration = {
    name: "configuration",
    path: "/configure",
    componentName: "Configuration",
    prettyName: "Configure Plugins",
    icon: SettingsInputSvideoIcon
  };
  registerRoute(Configuration);
};

export default registerRoutes;
