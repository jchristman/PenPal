import PenPal from "@penpal/core";
import { join } from "path";

const graphql_files = join(__dirname, "./*.graphql");

const loadGraphQLFiles = async () => {
  return PenPal.Utils.LoadGraphQLDirectories([
    subdir_graphql_files,
    graphql_files,
  ]);
};

export default loadGraphQLFiles;
