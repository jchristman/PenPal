import { registerRoute } from "@penpal/core";
import type { PenPalRoute } from "@penpal/types";
import ServerIcon from "@heroicons/react/24/outline/ServerIcon";

const registerRoutes = (): void => {
  const TestRange: PenPalRoute = {
    name: "testrange",
    path: "/testrange",
    componentName: "TestRange",
    prettyName: "Test Range",
    icon: ServerIcon,
  };
  registerRoute(TestRange, 3);
};

export default registerRoutes;

