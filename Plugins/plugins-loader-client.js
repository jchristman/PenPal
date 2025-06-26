//import.meta.glob("./**/client/index.js", { eager: true });
import.meta.glob("./Base/client/index.js", { eager: true });
import.meta.glob("./CoreAPI/client/index.js", { eager: true });

export default {
  registerPlugins: async () => {
    // do nothing, potentially
  },
};
