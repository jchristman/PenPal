let Plugins = null;

if (process.env.APP_ENV === "browser") {
  context = require.context(".", true, /.*\/client\/index.js$/);

  Plugins = {
    registerPlugins: async () => {
      context.keys().forEach((key) => {
        const module = context(key);
        // do nothing, this just needs to be here for webpack to not optimize it out
      });
    },
  };
} else {
  const glob = require("glob");
  const path = require("path");

  // Get the current file's path
  const currentFilePath = path.resolve(__dirname, __filename);

  // Pattern to match all Plugin index.js files
  const pattern = `${path.resolve(__dirname)}/**/server/index.js`;

  Plugins = {
    registerPlugins: async () => {
      try {
        const files = await new Promise((resolve, reject) => {
          glob(pattern, {}, (err, files) => {
            console.log(pattern, files);
            if (err) {
              reject(err);
            } else {
              resolve(files);
            }
          });
        });

        // Import each file using require()
        for (let file of files) {
          console.error(`Importing ${file}`);
          try {
            // Import the module using require()
            await import(file);
          } catch (error) {
            console.error(`[!] Failed to load ${file}`);
            console.error(error);
            return;
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  };
}

export default Plugins;
