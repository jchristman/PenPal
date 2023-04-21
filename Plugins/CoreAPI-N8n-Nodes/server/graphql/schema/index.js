import PenPal from "@penpal/core";
import { join } from "path";

const graphql_files = join(__dirname, "./*.graphql");

const loadGraphQLFiles = async () => {
  return PenPal.Utils.LoadGraphQLDirectories([graphql_files]);
};

export default loadGraphQLFiles;
