export default {
  async getHosts(root, args, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Hosts.GetMany(args);
  },
  async getHost(root, args, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Hosts.Get(args);
  },
};
