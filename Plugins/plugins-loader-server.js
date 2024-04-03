import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pattern to match all Plugin index.js files
const pattern = `${path.resolve(__dirname)}/**/server/index.js`;

export const registerPlugins = async () => {
  const files = await glob(pattern);

  // Import each file using require()
  for (let file of files) {
    // Import the module using require()
    try {
      await import(file);
    } catch (e) {
      console.error("Register Plugin", e);
    }
  }
};
