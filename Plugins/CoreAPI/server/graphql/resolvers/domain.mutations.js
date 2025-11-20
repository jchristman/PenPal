export default {
  async createDomain(root, { domain }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Domains.Insert(
      domain
    );

    if (accepted.length > 0) {
      return accepted[0];
    } else {
      throw rejected[0].error;
    }
  },

  async createDomains(root, { domains }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Domains.InsertMany(
      domains
    );

    if (accepted.length > 0) {
      return accepted;
    } else if (rejected.length > 0) {
      throw rejected[0].error;
    } else {
      return [];
    }
  },

  async updateDomain(root, { domain }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Domains.Update(
      domain
    );

    if (accepted.length > 0) {
      return accepted[0];
    } else if (rejected.length > 0) {
      throw rejected[0].error;
    } else {
      throw new Error("Domain update failed");
    }
  },

  async removeDomain(root, { id }, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Domains.Remove(id);
  },

  async removeDomains(root, { ids }, { PenPalCachingAPI }) {
    const result = await PenPalCachingAPI.Domains.RemoveMany(ids);
    return result > 0; // Return true if at least one domain was removed
  },

  async resolveDomain(root, { domainName }, { PenPalCachingAPI }) {
    const result = await PenPalCachingAPI.Domains.ResolveDomain(domainName);
    return result;
  },

  async resolveDomains(root, { domainNames }, { PenPalCachingAPI }) {
    const results = await PenPalCachingAPI.Domains.ResolveDomains(domainNames);
    return results;
  },
};
