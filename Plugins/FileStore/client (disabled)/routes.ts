import { registerRoute } from "@penpal/core";
import FolderIcon from "@mui/icons-material/Folder";

const registerRoutes = () => {
  const FileManager = {
    name: "file-manager",
    path: "/file-manager",
    componentName: "FileManagerPage",
    prettyName: "File Manager",
    icon: FolderIcon,
  };
  registerRoute(FileManager, 5); // Set order position
};

export default registerRoutes;
