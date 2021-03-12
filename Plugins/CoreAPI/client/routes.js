import { registerRoute } from "meteor/penpal";

import AccountTreeIcon from "@material-ui/icons/AccountTree";

const registerRoutes = () => {
  const Projects = {
    name: "projects",
    path: "/projects",
    componentName: "Projects",
    prettyName: "Projects",
    icon: AccountTreeIcon
  };
  registerRoute(Projects, 1);

  const Project = {
    name: "project",
    path: "/projects/:project_id",
    componentName: "Project"
  };
  registerRoute(Project);
};

export default registerRoutes;
