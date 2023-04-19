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

  // Pattern to match all Plugin index.js files
  const pattern = "*/**/server/index.js";

  // Get the current file's path
  const currentFilePath = path.resolve(__dirname, __filename);

  Plugins = {
    registerPlugins: async () => {
      // Use glob to find all files that match the pattern
      glob(pattern, {}, (err, files) => {
        if (err) {
          console.error(err);
          return;
        }

        // Import each file using require()
        files.forEach((file) => {
          // Get the absolute path of the file
          const absoluteFilePath = path.resolve(__dirname, file);

          // Get the relative path of the file
          const relativeFilePath = path.relative(
            currentFilePath,
            absoluteFilePath
          );

          // Import the module using require()
          const importedModule = require(`./${relativeFilePath}`);

          // Do something with the imported module
        });
      });
    },
  };
}

export default Plugins;
