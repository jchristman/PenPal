import PenPal from "#penpal/core";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const cur_dir = join(__dirname, ".");

const loadGraphQLFiles = async () => {
  return PenPal.Utils.LoadGraphQLDirectories(cur_dir);
};

export default loadGraphQLFiles;
