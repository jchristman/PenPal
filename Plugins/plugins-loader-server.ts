import PenPal from "#penpal/core";
// @ts-ignore - glob provides its own types but TypeScript may not resolve them
import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logger = PenPal.Utils.BuildLogger("PluginsLoader");

// Patterns to match all Plugin index files (prefer .ts over .js)
const tsPattern = `${path.resolve(__dirname)}/**/server/index.ts`;
const jsPattern = `${path.resolve(__dirname)}/**/server/index.js`;

export const registerPlugins = async () => {
  // Load .ts files first, then .js files
  const tsFiles = (await glob(tsPattern)).sort();
  const jsFiles = (await glob(jsPattern)).sort();

  const files = [...tsFiles, ...jsFiles];

  // Import each file
  for (const file of files) {
    try {
      await import(file);
    } catch (e) {
      logger.error(`Error importing file: ${file}`);
      logger.error(e instanceof Error ? e.message : String(e));
      logger.error(e instanceof Error ? e.stack : String(e));
    }
  }
};
