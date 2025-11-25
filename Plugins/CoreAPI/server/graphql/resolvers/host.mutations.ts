import PenPal from "#penpal/core";
import dns from "dns";
import { promisify } from "util";

const dnsLookup = promisify(dns.lookup);

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
    // Ensure each host has the project field set
    const hostsWithProject = hosts.map((host) => ({
      ...host,
      project: host.project || projectID,
    }));

    const { accepted, rejected } = await PenPalCachingAPI.Hosts.InsertMany(
      hostsWithProject
    );

    if (accepted.length > 0) {
      return accepted;
    } else if (rejected.length > 0) {
      throw rejected[0].error;
    } else {
      return [];
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
    return await PenPalCachingAPI.Hosts.Remove(id);
  },

  async removeHosts(root, { ids }, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Hosts.RemoveMany(ids);
  },
};
