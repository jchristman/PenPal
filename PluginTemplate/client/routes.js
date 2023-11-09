import { registerRoute } from "@penpal/core";

import QuizIcon from "@mui/icons-material/Quiz";

const registerRoutes = () => {
  const REPLACE_ME = {
    name: "REPLACE_ME".toLowerCase(),
    path: "/REPLACE_ME".toLowerCase(),
    componentName: "REPLACE_ME",
    prettyName: "REPLACE_ME",
    icon: QuizIcon,
  };
  registerRoute(REPLACE_ME);
};

export default registerRoutes;
