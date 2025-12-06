import PenPal from "#penpal/core";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const loadGraphQLFiles = async (): Promise<any> => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const cur_dir = join(__dirname, ".");
  return PenPal.Utils.LoadGraphQLDirectories(cur_dir);
};

export default loadGraphQLFiles;
