import PenPal from "#penpal/core";

export default {
  async getCoreAPIConfiguration(root, args, { PenPalCachingAPI }) {
    let hookURL =
      PenPal.DataStore.fetch("CoreAPI", "Configuration", {})[0]?.hookURL ?? "";
    return {
      hookURL,
    };
  },
};
