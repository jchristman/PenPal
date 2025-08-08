import PenPal from "#penpal/core";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const cur_dir = join(__dirname, ".");

import { resolvers as baseResolvers } from "./schema/resolvers.js";
import configResolvers from "./resolvers/ping.config.js";

const loadGraphQLFiles = async () => {
  return PenPal.Utils.LoadGraphQLDirectories(cur_dir);
};

export { loadGraphQLFiles };
export const resolvers = [baseResolvers, configResolvers];
