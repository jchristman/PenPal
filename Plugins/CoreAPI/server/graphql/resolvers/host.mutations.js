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

  async createHostsFromDomains(root, { projectID, domains }, { PenPalCachingAPI }) {
    // Resolve domains to IPs and create hostname mappings
    const domainToIPMap = new Map(); // domain -> ip
    const ipToDomainsMap = new Map(); // ip -> [domains]

    // Resolve all domains to IPs
    const domainResolutions = await Promise.allSettled(
      domains.map(async (domain) => {
        try {
          const { address } = await dnsLookup(domain, { family: 4 });
          return { domain, ip: address };
        } catch (error) {
          // DNS resolution failed - log but continue
          console.warn(`Failed to resolve domain ${domain}:`, error.message);
          return { domain, ip: null, error: error.message };
        }
      })
    );

    // Build maps of IP to domains
    for (const result of domainResolutions) {
      if (result.status === "fulfilled" && result.value.ip) {
        const { domain, ip } = result.value;
        domainToIPMap.set(domain, ip);
        
        if (!ipToDomainsMap.has(ip)) {
          ipToDomainsMap.set(ip, []);
        }
        ipToDomainsMap.get(ip).push(domain);
      }
    }

    if (ipToDomainsMap.size === 0) {
      return [];
    }

    // Get all existing hosts for this project
    const existingHosts = await PenPalCachingAPI.Hosts.GetManyByProjectID(projectID);
    const existingHostsByIP = new Map();
    for (const host of existingHosts) {
      existingHostsByIP.set(host.ip_address, host);
    }

    const hostsToUpdate = [];
    const hostsToCreate = [];

    // Process each resolved IP
    for (const [host_ip, newHostnames] of ipToDomainsMap.entries()) {
      const existingHost = existingHostsByIP.get(host_ip);
      
      if (existingHost) {
        // Host exists - merge hostnames (avoid duplicates)
        const existingHostnames = Array.isArray(existingHost.hostnames) 
          ? existingHost.hostnames 
          : [];
        const mergedHostnames = [
          ...new Set([...existingHostnames, ...newHostnames])
        ];
        
        hostsToUpdate.push({
          id: existingHost.id,
          hostnames: mergedHostnames,
        });
      } else {
        // Host doesn't exist - create new one
        hostsToCreate.push({
          project: projectID,
          ip_address: host_ip,
          hostnames: newHostnames,
        });
      }
    }

    const results = [];

    // Update existing hosts
    if (hostsToUpdate.length > 0) {
      for (const hostUpdate of hostsToUpdate) {
        try {
          await PenPalCachingAPI.Hosts.Update(hostUpdate);
          // Fetch the complete updated host object for GraphQL
          const updatedHost = await PenPalCachingAPI.Hosts.Get(hostUpdate.id);
          results.push(updatedHost);
        } catch (error) {
          console.warn(`Failed to update host ${hostUpdate.id}:`, error.message);
        }
      }
    }

    // Create new hosts
    if (hostsToCreate.length > 0) {
      const { accepted, rejected } = await PenPalCachingAPI.Hosts.InsertMany(hostsToCreate);
      if (accepted.length > 0) {
        results.push(...accepted);
      }
      if (rejected.length > 0) {
        console.warn(`Failed to create some hosts:`, rejected);
      }
    }

    // Update services that have null host references but match our newly created hosts
    if (hostsToCreate.length > 0 || hostsToUpdate.length > 0) {
      const allNewHosts = [...results];

      // Find services with null host references that match our host IPs
      for (const host of allNewHosts) {
        try {
          // Find services with null host that match this host's IP and project
          const orphanedServices = await PenPal.DataStore.fetch(
            "CoreAPI",
            "Services",
            {
              host: null,
              project: projectID,
              // We can't filter by IP directly since services don't have IP field
              // But we can check if any services exist for this project with null host
            }
          );

          if (orphanedServices.length > 0) {
            console.log(`[createHostsFromDomains] Found ${orphanedServices.length} services with null host references`);

            // For each orphaned service, we need to check if it should belong to this host
            // This is tricky because services don't store IP directly
            // We would need to cross-reference with network/host data
            // For now, let's log this issue
            console.warn(`[createHostsFromDomains] Cannot automatically fix orphaned services - manual intervention required`);
          }
        } catch (error) {
          console.warn(`[createHostsFromDomains] Error checking for orphaned services:`, error.message);
        }
      }
    }

    // Log for debugging
    if (results.length > 0) {
      console.log(`[createHostsFromDomains] Updated ${hostsToUpdate.length} existing hosts, created ${hostsToCreate.length} new hosts`);
    }

    return results;
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
