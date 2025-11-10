import { registerRoute } from "@penpal/core";
import ServerIcon from "@heroicons/react/24/outline/ServerIcon";

const registerRoutes = () => {
  const TestRange = {
    name: "testrange",
    path: "/testrange",
    componentName: "TestRange",
    prettyName: "Test Range",
    icon: ServerIcon,
  };
  registerRoute(TestRange, 3);
};

export default registerRoutes;

