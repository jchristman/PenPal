import PenPal from "#penpal/core";
import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logger = PenPal.Utils.BuildLogger("PluginsLoader");

// Pattern to match all Plugin index.js files
const pattern = `${path.resolve(__dirname)}/**/server/index.js`;

export const registerPlugins = async () => {
  const files = (await glob(pattern)).sort();

  // Import each file using require()
  for (let file of files) {
    // Import the module using require()
    try {
      await import(file);
    } catch (e) {
      logger.error(`Error importing file: ${file}`);
      logger.error(e.message);
      logger.error(e.stack);
    }
  }
};
