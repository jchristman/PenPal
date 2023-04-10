//import "./Base/client/index.js";
const context = require.context(".", true, /.*\/client\/index.js$/);

const Plugins = {
  registerPlugins: async () => {
    context.keys().forEach((key) => {
      const module = context(key);
      // do nothing, this just needs to be here for webpack to not optimize it out
    });
  },
};

export default Plugins;
