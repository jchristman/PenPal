import { registerRoute } from "@penpal/core";

import { FolderIcon } from "@heroicons/react/24/outline";

const registerRoutes = () => {
  const Projects = {
    name: "projects",
    path: "/projects",
    componentName: "Projects",
    prettyName: "Projects",
    icon: FolderIcon,
  };
  registerRoute(Projects, 1);
};

export default registerRoutes;
