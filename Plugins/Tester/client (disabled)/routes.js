import { registerRoute } from "@penpal/core";
import BugReportIcon from "@mui/icons-material/BugReport";

const registerRoutes = () => {
  const tester = {
    name: "plugin-tester",
    path: "/plugin-tester",
    componentName: "PluginTesterPage",
    prettyName: "Plugin Tester",
    icon: BugReportIcon,
  };
  registerRoute(tester);
};

export default registerRoutes;
