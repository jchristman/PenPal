export default {
  async createDomain(root, { domain }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Domains.Insert(domain);

    if (accepted.length > 0) {
      const createdDomain = accepted[0];

      // Automatically resolve the domain after creation
      try {
        const resolutionResult = await PenPalCachingAPI.Domains.ResolveDomain(createdDomain.name);
        if (resolutionResult && resolutionResult.resolved && resolutionResult.addresses && resolutionResult.addresses.length > 0) {
          // Update the domain with resolved IPs
          await PenPalCachingAPI.Domains.Update({
            id: createdDomain.id,
            resolved_ips: resolutionResult.addresses,
          });

          // Create or update hosts for the resolved IPs
          // For upsert, we need to handle merging domain_ids manually since upsert replaces the entire document
          for (const ip of resolutionResult.addresses) {
            // Check if host already exists
            const existingHosts = await PenPalCachingAPI.Hosts.GetManyByProjectID(createdDomain.project);
            const existingHost = existingHosts.find(h => h.ip_address === ip);

            if (existingHost) {
              // Update existing host by merging domain_ids
              const mergedDomainIds = [...new Set([...(existingHost.domain_ids || []), createdDomain.id])];
              await PenPalCachingAPI.Hosts.Update({
                id: existingHost.id,
                domain_ids: mergedDomainIds,
              });
            } else {
              // Create new host
              await PenPalCachingAPI.Hosts.Insert({
                project: createdDomain.project,
                ip_address: ip,
                domain_ids: [createdDomain.id],
              });
            }
          }

          // Return the updated domain
          return await PenPalCachingAPI.Domains.Get(createdDomain.id);
        }
      } catch (error) {
        // DNS resolution failed - that's OK, domains can be non-resolvable
        console.warn(`Failed to resolve domain ${createdDomain.name} after creation:`, error.message);
      }

      return createdDomain;
    } else {
      throw rejected[0].error;
    }
  },

  async createDomains(root, { domains }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Domains.InsertMany(domains);

    if (accepted.length > 0) {
      // Automatically resolve all created domains and create/update hosts
      const resolvedDomains = [];
      for (const domain of accepted) {
        try {
          const resolutionResult = await PenPalCachingAPI.Domains.ResolveDomain(domain.name);
          if (resolutionResult && resolutionResult.resolved && resolutionResult.addresses && resolutionResult.addresses.length > 0) {
            // Update the domain with resolved IPs
            await PenPalCachingAPI.Domains.Update({
              id: domain.id,
              resolved_ips: resolutionResult.addresses,
            });

            // Create or update hosts for the resolved IPs
            // For upsert, we need to handle merging domain_ids manually since upsert replaces the entire document
            for (const ip of resolutionResult.addresses) {
              // Check if host already exists
              const existingHosts = await PenPalCachingAPI.Hosts.GetManyByProjectID(domain.project);
              const existingHost = existingHosts.find(h => h.ip_address === ip);

              if (existingHost) {
                // Update existing host by merging domain_ids
                const mergedDomainIds = [...new Set([...(existingHost.domain_ids || []), domain.id])];
                await PenPalCachingAPI.Hosts.Update({
                  id: existingHost.id,
                  domain_ids: mergedDomainIds,
                });
              } else {
                // Create new host
                await PenPalCachingAPI.Hosts.Insert({
                  project: domain.project,
                  ip_address: ip,
                  domain_ids: [domain.id],
                });
              }
            }

            // Get the updated domain
            const updatedDomain = await PenPalCachingAPI.Domains.Get(domain.id);
            resolvedDomains.push(updatedDomain);
          } else {
            resolvedDomains.push(domain);
          }
        } catch (error) {
          // DNS resolution failed - that's OK, domains can be non-resolvable
          console.warn(`Failed to resolve domain ${domain.name} after creation:`, error.message);
          resolvedDomains.push(domain);
        }
      }

      return resolvedDomains;
    } else if (rejected.length > 0) {
      throw rejected[0].error;
    } else {
      return [];
    }
  },

  async updateDomain(root, { domain }, { PenPalCachingAPI }) {
    const { accepted, rejected } = await PenPalCachingAPI.Domains.Update(domain);

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
