import PenPal from "#penpal/core";
import _ from "lodash";

// Import the shared logger from plugin.js
import { CoreAPILogger as logger } from "../plugin.js";

import { required_field, isTestData } from "./common.js";

// -----------------------------------------------------------

export const getVulnerability = async (vulnerability_id, options) => {
  const is_test = isTestData(vulnerability_id);
  return is_test
    ? null // No test data for vulnerabilities yet
    : await PenPal.DataStore.fetchOne(
        "CoreAPI",
        "Vulnerabilities",
        {
          id: vulnerability_id,
        },
        options
      );
};

export const getVulnerabilities = async (vulnerability_ids, options) => {
  const is_test = isTestData(vulnerability_ids);
  return is_test
    ? []
    : await PenPal.DataStore.fetch(
        "CoreAPI",
        "Vulnerabilities",
        {
          id: { $in: vulnerability_ids },
        },
        options
      );
};

export const getVulnerabilitiesByProjectID = async (project_id, options) => {
  const result = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Vulnerabilities",
    {
      project: project_id,
    },
    options
  );

  return result;
};

export const getVulnerabilitiesByHostID = async (host_id, options) => {
  const result = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Vulnerabilities",
    {
      affectedHosts: { $in: [host_id] },
    },
    options
  );

  return result;
};

export const getVulnerabilitiesByServiceID = async (service_id, options) => {
  const result = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Vulnerabilities",
    {
      affectedServices: { $in: [service_id] },
    },
    options
  );

  return result;
};

// -----------------------------------------------------------

const default_vulnerability = {
  cveIds: [],
  affectedServices: [],
  references: [],
  status: "NEW",
  metadata: {},
};

export const insertVulnerability = async (vulnerability) => {
  return await insertVulnerabilities([vulnerability]);
};

export const insertVulnerabilities = async (vulnerabilities) => {
  const rejected = [];
  const _accepted = [];
  const accepted = [];

  for (let vulnerability of vulnerabilities) {
    try {
      required_field(vulnerability, "project", "insertion");
      required_field(vulnerability, "title", "insertion");
      required_field(vulnerability, "severity", "insertion");
      required_field(vulnerability, "discoveredBy", "insertion");
      required_field(vulnerability, "affectedHostIds", "insertion");

      if (!Array.isArray(vulnerability.affectedHostIds) || vulnerability.affectedHostIds.length === 0) {
        throw new Error("affectedHostIds must be a non-empty array");
      }

      // Validate affected hosts exist
      const hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
        id: { $in: vulnerability.affectedHostIds },
      });

      if (hosts.length !== vulnerability.affectedHostIds.length) {
        const found_ids = hosts.map((h) => h.id);
        const missing_ids = vulnerability.affectedHostIds.filter(
          (id) => !found_ids.includes(id)
        );
        throw new Error(`Hosts not found: ${missing_ids.join(", ")}`);
      }

      // Validate affected services exist if provided
      if (vulnerability.affectedServiceIds && vulnerability.affectedServiceIds.length > 0) {
        const services = await PenPal.DataStore.fetch("CoreAPI", "Services", {
          id: { $in: vulnerability.affectedServiceIds },
        });

        if (services.length !== vulnerability.affectedServiceIds.length) {
          const found_ids = services.map((s) => s.id);
          const missing_ids = vulnerability.affectedServiceIds.filter(
            (id) => !found_ids.includes(id)
          );
          throw new Error(`Services not found: ${missing_ids.join(", ")}`);
        }
      }

      // Ensure all hosts belong to the same project
      const project_ids = [...new Set(hosts.map((h) => h.project))];
      if (project_ids.length > 1) {
        throw new Error("All affected hosts must belong to the same project");
      }

      if (project_ids[0] !== vulnerability.project) {
        throw new Error("Vulnerability project must match affected hosts' project");
      }

      const _vulnerability = {
        ...vulnerability,
        ...default_vulnerability,
        affectedHosts: vulnerability.affectedHostIds,
        affectedServices: vulnerability.affectedServiceIds || [],
        discoveredAt: vulnerability.discoveredAt || new Date().toISOString(),
        status: vulnerability.status || "NEW",
      };

      // Remove input-only fields
      delete _vulnerability.affectedHostIds;
      delete _vulnerability.affectedServiceIds;

      _accepted.push(_vulnerability);
    } catch (e) {
      rejected.push({ vulnerability, error: e });
    }
  }

  if (_accepted.length > 0) {
    let new_vulnerability_ids = await PenPal.DataStore.insertMany(
      "CoreAPI",
      "Vulnerabilities",
      _accepted
    );

    const new_vulnerabilities = _.zipWith(
      new_vulnerability_ids,
      _accepted,
      ({ id }, _vulnerability) => ({
        id,
        ..._vulnerability,
      })
    );

    accepted.push(...new_vulnerabilities);
  }

  return { accepted, rejected };
};

// -----------------------------------------------------------

export const updateVulnerability = async (vulnerability) => {
  return await updateVulnerabilities([vulnerability]);
};

export const updateVulnerabilities = async (vulnerabilities) => {
  const rejected = [];
  const _accepted = [];
  const accepted = [];

  for (let vulnerability of vulnerabilities) {
    try {
      required_field(vulnerability, "id", "update");
      _accepted.push(vulnerability);
    } catch (e) {
      rejected.push({ vulnerability, error: e });
    }
  }

  let matched_vulnerabilities = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Vulnerabilities",
    {
      id: { $in: _accepted.map((v) => v.id) },
    }
  );

  if (matched_vulnerabilities.length !== _accepted.length) {
    logger.error('Implement updateVulnerabilities "vulnerability not found" functionality');
  }

  for (let { id, affectedHostIds, affectedServiceIds, ...vulnerability } of _accepted) {
    // Handle affectedHostIds update
    if (affectedHostIds !== undefined) {
      if (!Array.isArray(affectedHostIds) || affectedHostIds.length === 0) {
        throw new Error("affectedHostIds must be a non-empty array");
      }

      // Validate hosts exist
      const hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
        id: { $in: affectedHostIds },
      });

      if (hosts.length !== affectedHostIds.length) {
        const found_ids = hosts.map((h) => h.id);
        const missing_ids = affectedHostIds.filter((id) => !found_ids.includes(id));
        throw new Error(`Hosts not found: ${missing_ids.join(", ")}`);
      }

      vulnerability.affectedHosts = affectedHostIds;
    }

    // Handle affectedServiceIds update
    if (affectedServiceIds !== undefined) {
      if (affectedServiceIds.length > 0) {
        // Validate services exist
        const services = await PenPal.DataStore.fetch("CoreAPI", "Services", {
          id: { $in: affectedServiceIds },
        });

        if (services.length !== affectedServiceIds.length) {
          const found_ids = services.map((s) => s.id);
          const missing_ids = affectedServiceIds.filter((id) => !found_ids.includes(id));
          throw new Error(`Services not found: ${missing_ids.join(", ")}`);
        }
      }

      vulnerability.affectedServices = affectedServiceIds;
    }

    let res = await PenPal.DataStore.updateOne(
      "CoreAPI",
      "Vulnerabilities",
      { id },
      { $set: vulnerability }
    );

    accepted.push({ id, ...vulnerability });
  }

  return { accepted, rejected };
};

// -----------------------------------------------------------

export const upsertVulnerabilities = async (vulnerabilities) => {
  const result = [];
  const to_update = [];
  const to_insert = [];
  const rejected = [];

  for (let vulnerability of vulnerabilities) {
    if (vulnerability.id !== undefined) {
      to_update.push(vulnerability);
    } else {
      // For vulnerabilities without IDs, we could match by title + affected hosts + discoveredBy
      // For now, treat all as inserts
      to_insert.push(vulnerability);
    }
  }

  // Do the inserts and updates
  const inserted = await insertVulnerabilities(to_insert);
  const updated = await updateVulnerabilities(to_update);

  return {
    inserted,
    updated,
    rejected,
  };
};

// -----------------------------------------------------------

export const removeVulnerability = async (vulnerability_id) => {
  return await removeVulnerabilities([vulnerability_id]);
};

export const removeVulnerabilities = async (vulnerability_ids) => {
  // Get all the vulnerability data for hooks
  let vulnerabilities = await PenPal.DataStore.fetch("CoreAPI", "Vulnerabilities", {
    id: { $in: vulnerability_ids },
  });

  let res = await PenPal.DataStore.delete("CoreAPI", "Vulnerabilities", {
    id: { $in: vulnerability_ids },
  });

  return res > 0;
};

