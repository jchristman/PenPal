import PenPal from "meteor/penpal";

export default {
  async getCoreAPIConfiguration(root, args, { PenPalCachingAPI }) {
    let hookURL =
      PenPal.DataStore.fetch("CoreAPI", "Configuration", {})[0]?.hookURL ?? "";
    return {
      hookURL
    };
  }
};
