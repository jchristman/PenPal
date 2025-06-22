export default {
  async getServices(root, args, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Services.GetManyByProjectID(args.projectID);
  },
  async getService(root, args, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Services.Get(args);
  },
};
