const path = require("path");
const node_modules_paths = require("./node_modules.js");

module.exports = {
  stories: [
    "../stories/**/*.stories.@(js|jsx|ts|tsx)",
    "../plugins/**/stories/*.stories.@(js|jsx|ts|tsx)"
  ],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
  webpackFinal: async (config, { configType }) => {
    // Allow resolution of meteor/penpal and stories/common.js
    config.resolve.alias = {
      ...config.resolve.alias,
      "meteor/penpal": path.resolve(
        __dirname,
        "../packages/penpal/penpal-client.js"
      ),
      "meteor/meteor": path.resolve(__dirname, "./mocks/meteor.js"),
      stories: path.resolve(__dirname, "../stories/")
    };

    // Add the node modules from the PenPal meteor package
    config.resolve.modules.push(
      path.resolve(__dirname, "../packages/penpal/.npm/package/node_modules")
    );

    // Add the node modules from other plugins
    config.resolve.modules.push(
      ...node_modules_paths.map(function (_path) {
        // _path has the form "./plugins/path/to/node_modules"
        // so adding a . will cause it traverse up a directory
        return path.resolve(__dirname, "." + _path);
      })
    );

    // Scrap all other meteor imports
    config.module.rules.push({
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      loaders: [
        {
          loader: path.resolve(__dirname, "./loaders/scrap-meteor-loader.js"),
          options: {
            // those package will be preserved
            preserve: ["meteor/meteor", "meteor/penpal"]
          }
        }
      ]
    });

    return config;
  }
};
