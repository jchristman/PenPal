import PenPal from "meteor/penpal";

export default {
  async createHost(root, { projectID, host }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Hosts.Insert(
      projectID,
      host
    );

    if (accepted.length > 0) {
      return accepted[0];
    } else {
      throw rejected[0].error;
    }
  },

  async createHosts(root, { projectID, hosts }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Hosts.Insert(
      projectID,
      hosts
    );

    if (accepted.length > 0) {
      return accepted;
    } else {
      throw rejected[0].error;
    }
  },

  async updateHost(root, { host }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Hosts.Update(host);

    if (accepted.length > 0) {
      return accepted[0];
    } else {
      throw rejected[0].error;
    }
  },

  async removeHost(root, { id }, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Customers.Remove(id);
  }
};
