export default {
  async createCustomer(root, { customer }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Customers.Insert(
      customer
    );

    if (accepted.length > 0) {
      return accepted[0];
    } else {
      throw rejected[0].error;
    }
  },

  async updateCustomer(root, { customer }, context) {
    const { accepted, rejected } = await PenPalCachingAPI.Customers.Update(
      customer
    );

    if (accepted.length > 0) {
      return accepted[0];
    } else {
      throw rejected[0].error;
    }
  },

  async removeCustomer(root, { id }, context) {
    return await PenPalCachingAPI.Customers.Remove(id);
  }
};
