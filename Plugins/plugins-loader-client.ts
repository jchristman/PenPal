// Load plugin client index files (prefer .ts over .js)
import.meta.glob("./**/client/index.{ts,js}", {
  eager: true,
});

export default {
  registerPlugins: async () => {
    // do nothing, potentially
  },
};
