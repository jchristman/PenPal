import PenPal from "#penpal/core";
import _ from "lodash";

import { required_field } from "./common.ts";

// Import the shared logger from plugin.js
import { CoreAPILogger as logger } from "../plugin.ts";

// -----------------------------------------------------------
// Domain CRUD operations

export const getDomain = async (domain_id, options) => {
  return await PenPal.DataStore.fetchOne(
    "CoreAPI",
    "Domains",
    { id: domain_id },
    options
  );
};

export const getDomains = async (domain_ids, options) => {
  return await PenPal.DataStore.fetch(
    "CoreAPI",
    "Domains",
    { id: { $in: domain_ids } },
    options
  );
};

export const getDomainsByProject = async (project_id, options) => {
  return await PenPal.DataStore.fetch(
    "CoreAPI",
    "Domains",
    { project: project_id },
    options
  );
};

export const getDomainsPaginationInfo = async (domain_ids = [], options) => {
  return await PenPal.DataStore.getPaginationInfo(
    "CoreAPI",
    "Domains",
    { id: { $in: domain_ids } },
    options
  );
};

// -----------------------------------------------------------

const default_domain = {
  resolved_ips: [],
};

export const insertDomain = async (domain) => {
  return await insertDomains([domain]);
};

export const insertDomains = async (domains) => {
  const rejected = [];
  const accepted = [];

  for (let domain of domains) {
    try {
      required_field(domain, "project", "insertion");
      required_field(domain, "name", "insertion");

      const _domain = {
        ...default_domain,
        ...domain,
      };

      accepted.push(_domain);
    } catch (e) {
      rejected.push({ domain, error: e });
    }
  }

  if (accepted.length > 0) {
    let new_domain_ids = await PenPal.DataStore.insertMany(
      "CoreAPI",
      "Domains",
      accepted
    );

    const new_domains = _.zipWith(
      new_domain_ids,
      accepted,
      ({ id }, _domain) => ({
        id,
        ..._domain,
      })
    );

    // Automatically resolve all created domains and create/update hosts
    const resolved_domains = [];
    for (const domain of new_domains) {
      try {
        const resolutionResult = await resolveDomain(domain.name);
        if (
          resolutionResult &&
          resolutionResult.resolved &&
          resolutionResult.addresses &&
          resolutionResult.addresses.length > 0
        ) {
          // Update the domain with resolved IPs
          await PenPal.DataStore.updateOne(
            "CoreAPI",
            "Domains",
            { id: domain.id },
            { resolved_ips: resolutionResult.addresses }
          );

          // Create or update hosts for the resolved IPs
          for (const ip of resolutionResult.addresses) {
            // Check if host already exists
            const existingHosts = await PenPal.DataStore.fetch(
              "CoreAPI",
              "Hosts",
              {
                project: domain.project,
                ip_address: ip,
              }
            );

            if (existingHosts.length > 0) {
              // Update existing host by adding domain_id to domain_ids array
              const existingHost = existingHosts[0];
              await PenPal.DataStore.updateOne(
                "CoreAPI",
                "Hosts",
                { id: existingHost.id },
                { $addToSet: { domain_ids: domain.id } }
              );
            } else {
              // Create new host using the API (which handles classification automatically)
              const newHostData = {
                project: domain.project,
                ip_address: ip,
                domain_ids: [domain.id],
              };

              await PenPal.API.Hosts.Insert(newHostData);
            }
          }

          // Get the updated domain
          const updatedDomain = await PenPal.DataStore.fetchOne(
            "CoreAPI",
            "Domains",
            { id: domain.id }
          );
          resolved_domains.push(updatedDomain);
        } else {
          resolved_domains.push(domain);
        }
      } catch (error) {
        // DNS resolution failed - that's OK, domains can be non-resolvable
        logger.warn(
          `Failed to resolve domain ${domain.name} after creation:`,
          error.message
        );
        resolved_domains.push(domain);
      }
    }

    return { accepted: resolved_domains, rejected };
  }

  return { accepted, rejected };
};

export const updateDomain = async (domain) => {
  return await updateDomains([domain]);
};

export const updateDomains = async (domains) => {
  const rejected = [];
  const accepted = [];

  for (let domain of domains) {
    try {
      required_field(domain, "id", "update");
      accepted.push(domain);
    } catch (e) {
      rejected.push({ domain, error: e });
    }
  }

  if (accepted.length > 0) {
    const matched_domains = await PenPal.DataStore.fetch("CoreAPI", "Domains", {
      id: { $in: accepted.map((d) => d.id) },
    });

    if (matched_domains.length !== accepted.length) {
      logger.error('Implement updateDomains "domain not found" functionality');
    }

    for (let { id, ...domain } of accepted) {
      await PenPal.DataStore.updateOne("CoreAPI", "Domains", { id }, domain);
    }

    // Return updated domains
    const updated_domains = await getDomains(accepted.map((d) => d.id));
    return { accepted: updated_domains, rejected };
  }

  return { accepted, rejected };
};

// -----------------------------------------------------------
// Domain resolution utilities

import dns from "dns";
import { promisify } from "util";
const dnsLookup = promisify(dns.lookup);

export const resolveDomain = async (domain_name) => {
  try {
    const { address } = await dnsLookup(domain_name, { family: 4 });
    return { resolved: true, addresses: [address] };
  } catch (error) {
    logger.debug(`Domain ${domain_name} resolution failed:`, error.message);
    return { resolved: false, error: error.message, addresses: [] };
  }
};

export const resolveDomains = async (domain_names) => {
  const results = await Promise.allSettled(
    domain_names.map(async (domain_name) => {
      const result = await resolveDomain(domain_name);
      return { domain: domain_name, ...result };
    })
  );

  return results.map((result) =>
    result.status === "fulfilled" ? result.value : result.reason
  );
};

// -----------------------------------------------------------
// Domain removal functions

export const removeDomain = async (domain_id) => {
  return await removeDomains([domain_id]);
};

export const removeDomains = async (domain_ids) => {
  // Get all the domain data for hooks so the deleted domain hook has some info for notifications and such
  let domains = await PenPal.DataStore.fetch("CoreAPI", "Domains", {
    id: { $in: domain_ids },
  });

  let res = await PenPal.DataStore.delete("CoreAPI", "Domains", {
    id: { $in: domain_ids },
  });

  if (res > 0) {
    const deleted_domain_ids = domains.map(({ id }) => id);
    // Note: Add MQTT publishing here if needed for domain deletions
    logger.log(`Removed ${deleted_domain_ids.length} domains`);
  }

  return res;
};
