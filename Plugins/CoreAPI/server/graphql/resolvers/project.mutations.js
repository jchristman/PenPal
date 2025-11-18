import dns from "dns";
import { promisify } from "util";

const dnsLookup = promisify(dns.lookup);

export default {
  async createProject(
    root,
    { project: { scope: { hosts = [], networks = [], domains = [] } = {}, ...project } },
    { PenPalCachingAPI }
  ) {
    const insertResult = await PenPalCachingAPI.Projects.Insert(project);

    // Handle different response formats
    let accepted, rejected;
    if (
      insertResult &&
      typeof insertResult === "object" &&
      insertResult.accepted &&
      insertResult.rejected
    ) {
      ({ accepted, rejected } = insertResult);
    } else {
      throw new Error("Invalid response from Projects.Insert");
    }

    if (accepted && accepted.length > 0) {
      // We need to get the project so we can update it
      const project = await PenPalCachingAPI.Projects.Get(accepted[0].id);

      if (networks.length > 0) {
        const { accepted: new_networks } =
          await PenPalCachingAPI.Networks.InsertMany(
            networks.map((subnet) => ({ project: project.id, subnet }))
          );

        // NOTE: This will maybe cause a memory error if new_networks has a length > 100,000 ish. Is this actually a problem?
        project.scope.networks.push(
          ...new_networks.map((network) => network.id)
        );
      }

      // Resolve domains to IPs and create hostname mappings
      const domainToIPMap = new Map(); // domain -> ip
      const ipToDomainsMap = new Map(); // ip -> [domains]

      if (domains.length > 0) {
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
      }

      // Combine direct IPs and resolved domain IPs
      // Use a Set to deduplicate IPs
      const allIPs = new Set(hosts);
      for (const ip of domainToIPMap.values()) {
        allIPs.add(ip);
      }

      if (allIPs.size > 0) {
        // Create hosts with hostnames from domains
        // If an IP was provided directly AND resolved from a domain, merge the hostnames
        const hostInputs = Array.from(allIPs).map((host_ip) => {
          const hostnames = ipToDomainsMap.get(host_ip) || [];
          return {
            project: project.id,
            ip_address: host_ip,
            hostnames: hostnames.length > 0 ? hostnames : undefined,
          };
        });

        const { accepted: new_hosts } = await PenPalCachingAPI.Hosts.InsertMany(hostInputs);

        // NOTE: This will maybe cause a memory error if new_hosts has a length > 100,000 ish. Is this actually a problem?
        project.scope.hosts.push(...new_hosts.map((host) => host.id));
      }

      await PenPalCachingAPI.Projects.Update({
        id: project.id,
        "scope.hosts": project.scope.hosts,
        "scope.networks": project.scope.networks,
      });

      return project;
    } else if (rejected && rejected.length > 0) {
      throw rejected[0].error || new Error("Project creation failed");
    } else {
      throw new Error("Project creation returned empty result");
    }
  },

  async updateProject(root, { project }, { PenPalCachingAPI }) {
    try {
      console.log(
        "updateProject called with:",
        JSON.stringify(project, null, 2)
      );

      // Validate input
      if (!project.id) {
        throw new Error("Project ID is required");
      }

      // First check if the project exists
      const existingProject = await PenPalCachingAPI.Projects.Get(project.id);
      console.log("Existing project found:", existingProject ? "YES" : "NO");
      if (existingProject) {
        console.log(
          "Existing project data:",
          JSON.stringify(existingProject, null, 2)
        );
      } else {
        throw new Error(`Project with ID ${project.id} not found`);
      }

      // If updating profile, check if the profile exists
      if (project.profile) {
        console.log("Checking if profile exists:", project.profile);
        // Note: We can't easily check profile existence here without importing the Base plugin
        // But we can at least log it for debugging
      }

      const result = await PenPalCachingAPI.Projects.Update(project);
      console.log("updateProject result:", JSON.stringify(result, null, 2));

      // Handle different response formats
      if (result && typeof result === "object") {
        // Check if it has the expected { accepted, rejected } structure
        if (result.accepted && result.rejected) {
          const { accepted, rejected } = result;
          if (accepted && accepted.length > 0) {
            return accepted[0];
          } else if (rejected && rejected.length > 0) {
            throw rejected[0].error || new Error("Update failed");
          } else {
            // If both accepted and rejected are empty, the update might have succeeded
            // but returned an empty result. Let's verify by fetching the project again.
            console.log(
              "Update returned empty result, fetching project to verify..."
            );
            const updatedProject = await PenPalCachingAPI.Projects.Get(
              project.id
            );
            if (updatedProject) {
              console.log(
                "Project fetched after update:",
                JSON.stringify(updatedProject, null, 2)
              );
              return updatedProject;
            } else {
              throw new Error(
                "Update returned empty result and project could not be refetched"
              );
            }
          }
        }
        // If it doesn't have accepted/rejected, it might be the updated object directly
        else {
          return result;
        }
      } else {
        throw new Error("Invalid response from Projects.Update");
      }
    } catch (error) {
      console.error("Error in updateProject:", error);
      throw new Error(`Failed to update project: ${error.message}`);
    }
  },

  async removeProject(root, { id }, { PenPalCachingAPI }) {
    return await PenPalCachingAPI.Projects.Remove(id);
  },
};
