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

  // Add route for individual project view
  const ProjectView = {
    name: "project-view",
    path: "/projects/:project_id",
    componentName: "Project",
    prettyName: "Project View",
    icon: FolderIcon,
    hideFromNav: true, // Don't show individual project views in navigation
  };
  registerRoute(ProjectView);
};

export default registerRoutes;
