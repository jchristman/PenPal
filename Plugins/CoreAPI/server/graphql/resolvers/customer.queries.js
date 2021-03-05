export default {
  async getCustomer(root, { id }, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Customers.Get({ id });
  },
  async getCustomers(root, args, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Customers.GetMany();
  }
};
