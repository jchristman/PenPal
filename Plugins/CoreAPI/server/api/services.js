import PenPal from "#penpal/core";
import { check } from "#penpal/common";
import _ from "lodash";

// Import the shared logger from plugin.js
import { CoreAPILogger as logger } from "../plugin.js";

import { required_field, isTestData } from "./common.js";

import { addServicesToHost } from "./hosts.js";
//import { services as mockServices } from "../test/mock-services.json";
//import { newServiceHooks, deletedServiceHooks, updatedServiceHooks } from "./hooks.js";

// -----------------------------------------------------------

export const getService = async (service_id, options) => {
  const is_test = isTestData(service_id);
  return is_test
    ? _.find(mockServices, (service) => service.id === service_id)
    : await PenPal.DataStore.fetchOne(
        "CoreAPI",
        "Services",
        {
          id: service_id,
        },
        options
      );
};

export const getServices = async (service_ids, options) => {
  const is_test = isTestData(service_ids);
  return is_test
    ? _.map(service_ids, (id) =>
        _.find(mockServices, (service) => service.id === id)
      )
    : await PenPal.DataStore.fetch(
        "CoreAPI",
        "Services",
        {
          id: { $in: service_ids },
        },
        options
      );
};

export const getServicesPaginationInfo = async (service_ids = [], options) => {
  return await PenPal.DataStore.getPaginationInfo(
    "CoreAPI",
    "Services",
    { id: { $in: service_ids } },
    options
  );
};

export const getServicesByProject = async (project_id, options) => {
  const result = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Services",
    {
      project: project_id,
    },
    options
  );

  return result;
};

export const getServicesByNetwork = async (network_id, options) => {
  const result = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Services",
    {
      network: network_id,
    },
    options
  );

  return result;
};

export const getServicesByHost = async (host_id, options) => {
  const result = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Services",
    {
      host: host_id,
    },
    options
  );

  return result;
};

export const getServicesByHosts = async (host_ids, options) => {
  const result = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Services",
    {
      host: { $in: host_ids },
    },
    options
  );

  return result;
};

// -----------------------------------------------------------

const default_service = {};

export const insertService = async (service) => {
  return await insertServices([service]);
};

export const insertServices = async (services) => {
  const rejected = [];
  const _accepted = [];
  const accepted = [];

  for (let service of services) {
    try {
      required_field(service, "host", "insertion");
      required_field(service, "project", "insertion");
      required_field(service, "name", "insertion");

      const _service = { ...service, ...default_service };
      _accepted.push(_service);
    } catch (e) {
      rejected.push({ service, error: e });
    }
  }

  if (_accepted.length > 0) {
    let new_service_ids = await PenPal.DataStore.insertMany(
      "CoreAPI",
      "Services",
      _accepted
    );

    const new_services = _.zipWith(
      new_service_ids,
      _accepted,
      ({ id }, _service) => ({
        id,
        ..._service,
      })
    );

    const host_new_services = _.groupBy(new_services, "host");
    for (let host_id in host_new_services) {
      if (host_id !== undefined) {
        await addServicesToHost(
          host_id,
          host_new_services[host_id].map(({ id }) => id)
        );
      }
    }

    accepted.push(...new_services);
  }

  if (accepted.length > 0) {
    const new_service_ids = accepted.map(({ id }) => id);
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.New.Services, {
      project: services[0].project,
      service_ids: new_service_ids,
    });
  }

  return { accepted, rejected };
};

// -----------------------------------------------------------

export const updateService = async (service) => {
  return await updateServices([service]);
};

export const updateServices = async (services) => {
  const rejected = [];
  const _accepted = [];
  const accepted = [];

  for (let service of services) {
    try {
      required_field(service, "id", "update");
      _accepted.push(service);
    } catch (e) {
      rejected.push({ service, error: e });
    }
  }

  let matched_services = await PenPal.DataStore.fetch("CoreAPI", "Services", {
    id: { $in: _accepted.map((service) => service.id) },
  });

  if (matched_services.length !== _accepted.length) {
    // Find the unknown IDs
    logger.error('Implement updateServices "service not found" functionality');
    logger.log(_accepted, matched_services);
  }

  for (let { id, ...service } of _accepted) {
    // TODO: Optimize with updateMany

    let res = await PenPal.DataStore.updateOne(
      "CoreAPI",
      "Services",
      { id },
      { $set: service } // Use explicit $set for partial updates like other entities
    );

    // TODO: See if this is actually right
    accepted.push({ id, ...service });
  }

  if (accepted.length > 0) {
    const update_service_ids = accepted.map(({ id }) => id);
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Update.Services, {
      project: services[0].project,
      service_ids: update_service_ids,
    });
  }

  return { accepted, rejected };
};

// -----------------------------------------------------------

export const upsertServices = async (services) => {
  const result = [];
  const to_update = [];
  const to_insert = [];
  const rejected = [];

  // Not all services should already have a matched host id. Find services that already exist

  const to_check = [];

  for (let i = 0; i < services.length; i++) {
    let service = services[i];

    // If service has an ID, treat it as an update
    if (service.id) {
      to_update.push(service);
      // Splice and decrement the counter to account for the changed length of the array
      services.splice(i, 1);
      i--;
    } else {
      // If no ID, check for existing service by host/protocol/port within the project

      // Project is required to prevent cross-project conflicts
      if (!service.project) {
        rejected.push({
          service,
          error:
            "project is required when upserting services without ID to avoid conflicts across customers/projects",
        });
        services.splice(i, 1);
        i--;
        continue;
      }

      let selector = {
        $and: [
          { host: service.host },
          {
            ip_protocol: {
              $regex: new RegExp(`^${service.ip_protocol}$`, "i"),
            },
          }, // Case-insensitive protocol match
          { port: service.port },
          { project: service.project }, // Always include project scoping
        ],
      };

      let exists = await PenPal.DataStore.fetch(
        "CoreAPI",
        "Services",
        selector
      );
      if (exists.length > 0) {
        to_update.push({ id: exists[0].id, ...service });

        // Splice and decrement the counter to account for the changed length of the array
        services.splice(i, 1);
        i--;
      }
    }
  }

  for (let service of services) {
    to_insert.push(service);
  }

  // Do the inserts and updates
  const inserted = await insertServices(to_insert);
  const updated = await updateServices(to_update);

  return {
    inserted,
    updated,
    rejected,
  };
};

// -----------------------------------------------------------

export const removeService = async (service_id) => {
  return await removeServices([service_id]);
};

export const removeServices = async (service_ids) => {
  // Get all the service data for hooks so the deleted service hook has some info for notifications and such
  let services = await PenPal.DataStore.fetch("CoreAPI", "Services", {
    id: { $in: service_ids },
  });

  let res = await PenPal.DataStore.delete("CoreAPI", "Services", {
    id: { $in: service_ids },
  });

  if (res > 0) {
    const deleted_service_ids = services.map(({ id }) => id);
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Delete.Services, {
      project: services[0].project,
      host_ids: deleted_service_ids,
    });

    return true;
  }

  return false;
};

// -----------------------------------------------------------
// Enrichment Management Functions
//
// These functions provide a safe, atomic way to manage service enrichments
// without risk of overwriting existing service data. They support two ways
// to identify services:
//
// 1. By service_id (backward compatibility):
//    { service_id: "12345" }
//
// 2. By host/port combination (recommended for plugins):
//    { host: "host_id", port: 80, ip_protocol: "TCP" }
//
// All functions use MongoDB atomic operators ($push, $set, $pull) to ensure
// data integrity during concurrent operations.
// -----------------------------------------------------------

export const addEnrichment = async (service_selector, enrichment) => {
  return await addEnrichments([{ ...service_selector, enrichment }]);
};

export const addEnrichments = async (enrichment_updates) => {
  const results = [];
  const rejected = [];

  for (const enrichment_update of enrichment_updates) {
    try {
      const { enrichment, ...service_selector } = enrichment_update;

      // Validate required fields
      if (!enrichment || !enrichment.plugin_name) {
        throw new Error("enrichment must have plugin_name");
      }

      // Find the service using either service_id or host/port combination
      let service;
      let service_id;

      if (service_selector.service_id) {
        // Direct service ID lookup (backward compatibility)
        service_id = service_selector.service_id;
        service = await PenPal.DataStore.fetchOne("CoreAPI", "Services", {
          id: service_id,
        });
        if (!service) {
          throw new Error(`Service not found: ${service_id}`);
        }
      } else if (service_selector.host && service_selector.port) {
        // Find service by host/port combination
        // Note: host can be either a Host ID or an IP address
        const {
          host,
          port,
          ip_protocol = "tcp",
          project_id,
        } = service_selector;

        // Project ID is required when using host/port lookup to avoid conflicts across projects
        if (!project_id) {
          throw new Error(
            "project_id is required when using host/port lookup to avoid conflicts across customers/projects"
          );
        }

        let host_id = host;

        // Check if host is an IP address (not a Host ID)
        // Host IDs are typically long alphanumeric strings, IP addresses contain dots
        if (host.includes(".") || host.includes(":")) {
          // This looks like an IP address, need to find the Host ID first with project scoping
          const hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
            $and: [{ ip_address: host }, { project: project_id }],
          });

          if (hosts.length === 0) {
            throw new Error(
              `Host not found for IP address=${host} in project=${project_id}`
            );
          }

          if (hosts.length > 1) {
            throw new Error(
              `Multiple hosts found for IP address=${host} in project=${project_id}`
            );
          }

          host_id = hosts[0].id;
        }

        const selector = {
          $and: [
            { host: host_id }, // Use the Host ID, not IP address
            { port },
            { ip_protocol: { $regex: new RegExp(`^${ip_protocol}$`, "i") } }, // Case-insensitive protocol match
            { project: project_id }, // Ensure service belongs to correct project
          ],
        };

        const services = await PenPal.DataStore.fetch(
          "CoreAPI",
          "Services",
          selector
        );
        if (services.length === 0) {
          throw new Error(
            `Service not found for host=${host}, port=${port}, protocol=${ip_protocol} in project=${project_id}`
          );
        }
        if (services.length > 1) {
          throw new Error(
            `Multiple services found for host=${host}, port=${port}, protocol=${ip_protocol} in project=${project_id}`
          );
        }

        service = services[0];
        service_id = service.id;
      } else {
        throw new Error("Either service_id or host+port must be provided");
      }

      // Use MongoDB $push to append enrichment to array
      const result = await PenPal.DataStore.updateOne(
        "CoreAPI",
        "Services",
        { id: service_id },
        { $push: { enrichments: enrichment } }
      );

      results.push({ service_id, enrichment, result });
    } catch (error) {
      rejected.push({ enrichment_update, error: error.message });
    }
  }

  // Publish MQTT update for successful enrichments
  if (results.length > 0) {
    const service_ids = results.map((r) => r.service_id);
    const first_service = await PenPal.DataStore.fetchOne(
      "CoreAPI",
      "Services",
      { id: service_ids[0] }
    );

    if (first_service) {
      PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Update.Services, {
        project: first_service.project,
        service_ids,
      });
    }
  }

  return { accepted: results, rejected };
};

export const updateEnrichment = async (
  service_selector,
  plugin_name,
  updated_enrichment
) => {
  try {
    // Validate required fields
    if (!plugin_name) {
      throw new Error("plugin_name is required");
    }
    if (!updated_enrichment || !updated_enrichment.plugin_name) {
      throw new Error("updated_enrichment must have plugin_name");
    }

    // Find the service using either service_id or host/port combination
    let service;
    let service_id;

    if (service_selector.service_id) {
      // Direct service ID lookup (backward compatibility)
      service_id = service_selector.service_id;
      service = await PenPal.DataStore.fetchOne("CoreAPI", "Services", {
        id: service_id,
      });
      if (!service) {
        throw new Error(`Service not found: ${service_id}`);
      }
    } else if (service_selector.host && service_selector.port) {
      // Find service by host/port combination
      // Note: host can be either a Host ID or an IP address
      const { host, port, ip_protocol = "tcp", project_id } = service_selector;

      // Project ID is required when using host/port lookup to avoid conflicts across projects
      if (!project_id) {
        throw new Error(
          "project_id is required when using host/port lookup to avoid conflicts across customers/projects"
        );
      }

      let host_id = host;

      // Check if host is an IP address (not a Host ID)
      // Host IDs are typically long alphanumeric strings, IP addresses contain dots
      if (host.includes(".") || host.includes(":")) {
        // This looks like an IP address, need to find the Host ID first with project scoping
        const hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
          $and: [{ ip_address: host }, { project: project_id }],
        });

        if (hosts.length === 0) {
          throw new Error(
            `Host not found for IP address=${host} in project=${project_id}`
          );
        }

        if (hosts.length > 1) {
          throw new Error(
            `Multiple hosts found for IP address=${host} in project=${project_id}`
          );
        }

        host_id = hosts[0].id;
      }

      const selector = {
        $and: [
          { host: host_id },
          { port },
          { ip_protocol: { $regex: new RegExp(`^${ip_protocol}$`, "i") } }, // Case-insensitive protocol match
          { project: project_id }, // Ensure service belongs to correct project
        ],
      };

      const services = await PenPal.DataStore.fetch(
        "CoreAPI",
        "Services",
        selector
      );
      if (services.length === 0) {
        throw new Error(
          `Service not found for host=${host}, port=${port}, protocol=${ip_protocol} in project=${project_id}`
        );
      }
      if (services.length > 1) {
        throw new Error(
          `Multiple services found for host=${host}, port=${port}, protocol=${ip_protocol} in project=${project_id}`
        );
      }

      service = services[0];
      service_id = service.id;
    } else {
      throw new Error("Either service_id or host+port must be provided");
    }

    // Use MongoDB positional operator to update specific enrichment
    const result = await PenPal.DataStore.updateOne(
      "CoreAPI",
      "Services",
      {
        id: service_id,
        "enrichments.plugin_name": plugin_name,
      },
      { $set: { "enrichments.$": updated_enrichment } }
    );

    // Publish MQTT update
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Update.Services, {
      project: service.project,
      service_ids: [service_id],
    });

    return { success: true, service_id, plugin_name, updated_enrichment };
  } catch (error) {
    return {
      success: false,
      service_selector,
      plugin_name,
      error: error.message,
    };
  }
};

export const upsertEnrichment = async (service_selector, enrichment) => {
  try {
    // Validate required fields
    if (!enrichment || !enrichment.plugin_name) {
      throw new Error("enrichment must have plugin_name");
    }

    // Find the service using either service_id or host/port combination
    let service;
    let service_id;

    if (service_selector.service_id) {
      // Direct service ID lookup (backward compatibility)
      service_id = service_selector.service_id;
      service = await PenPal.DataStore.fetchOne("CoreAPI", "Services", {
        id: service_id,
      });
      if (!service) {
        throw new Error(`Service not found: ${service_id}`);
      }
    } else if (service_selector.host && service_selector.port) {
      // Find service by host/port combination
      // Note: host can be either a Host ID or an IP address
      const { host, port, ip_protocol = "tcp", project_id } = service_selector;

      // Project ID is required when using host/port lookup to avoid conflicts across projects
      if (!project_id) {
        throw new Error(
          "project_id is required when using host/port lookup to avoid conflicts across customers/projects"
        );
      }

      let host_id = host;

      // Check if host is an IP address (not a Host ID)
      // Host IDs are typically long alphanumeric strings, IP addresses contain dots
      if (host.includes(".") || host.includes(":")) {
        // This looks like an IP address, need to find the Host ID first with project scoping
        const hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
          $and: [{ ip_address: host }, { project: project_id }],
        });

        if (hosts.length === 0) {
          throw new Error(
            `Host not found for IP address=${host} in project=${project_id}`
          );
        }

        if (hosts.length > 1) {
          throw new Error(
            `Multiple hosts found for IP address=${host} in project=${project_id}`
          );
        }

        host_id = hosts[0].id;
      }

      const selector = {
        $and: [
          { host: host_id },
          { port },
          { ip_protocol: { $regex: new RegExp(`^${ip_protocol}$`, "i") } }, // Case-insensitive protocol match
          { project: project_id }, // Ensure service belongs to correct project
        ],
      };

      const services = await PenPal.DataStore.fetch(
        "CoreAPI",
        "Services",
        selector
      );
      if (services.length === 0) {
        throw new Error(
          `Service not found for host=${host}, port=${port}, protocol=${ip_protocol} in project=${project_id}`
        );
      }
      if (services.length > 1) {
        throw new Error(
          `Multiple services found for host=${host}, port=${port}, protocol=${ip_protocol} in project=${project_id}`
        );
      }

      service = services[0];
      service_id = service.id;
    } else {
      throw new Error("Either service_id or host+port must be provided");
    }

    const plugin_name = enrichment.plugin_name;
    const existing_enrichments = service.enrichments || [];

    // Check if enrichment from this plugin already exists
    const existing_index = existing_enrichments.findIndex(
      (e) => e.plugin_name === plugin_name
    );

    let result;
    let operation;

    if (existing_index >= 0) {
      // Update existing enrichment
      result = await PenPal.DataStore.updateOne(
        "CoreAPI",
        "Services",
        {
          id: service_id,
          "enrichments.plugin_name": plugin_name,
        },
        { $set: { "enrichments.$": enrichment } }
      );
      operation = "updated";
    } else {
      // Add new enrichment
      result = await PenPal.DataStore.updateOne(
        "CoreAPI",
        "Services",
        { id: service_id },
        { $push: { enrichments: enrichment } }
      );
      operation = "added";
    }

    // Publish MQTT update
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Update.Services, {
      project: service.project,
      service_ids: [service_id],
    });

    return { success: true, service_id, operation, enrichment };
  } catch (error) {
    return { success: false, service_selector, error: error.message };
  }
};

export const removeEnrichment = async (service_selector, plugin_name) => {
  try {
    // Validate required fields
    if (!plugin_name) {
      throw new Error("plugin_name is required");
    }

    // Find the service using either service_id or host/port combination
    let service;
    let service_id;

    if (service_selector.service_id) {
      // Direct service ID lookup (backward compatibility)
      service_id = service_selector.service_id;
      service = await PenPal.DataStore.fetchOne("CoreAPI", "Services", {
        id: service_id,
      });
      if (!service) {
        throw new Error(`Service not found: ${service_id}`);
      }
    } else if (service_selector.host && service_selector.port) {
      // Find service by host/port combination
      // Note: host can be either a Host ID or an IP address
      const { host, port, ip_protocol = "tcp", project_id } = service_selector;

      // Project ID is required when using host/port lookup to avoid conflicts across projects
      if (!project_id) {
        throw new Error(
          "project_id is required when using host/port lookup to avoid conflicts across customers/projects"
        );
      }

      let host_id = host;

      // Check if host is an IP address (not a Host ID)
      // Host IDs are typically long alphanumeric strings, IP addresses contain dots
      if (host.includes(".") || host.includes(":")) {
        // This looks like an IP address, need to find the Host ID first with project scoping
        const hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
          $and: [{ ip_address: host }, { project: project_id }],
        });

        if (hosts.length === 0) {
          throw new Error(
            `Host not found for IP address=${host} in project=${project_id}`
          );
        }

        if (hosts.length > 1) {
          throw new Error(
            `Multiple hosts found for IP address=${host} in project=${project_id}`
          );
        }

        host_id = hosts[0].id;
      }

      const selector = {
        $and: [
          { host: host_id },
          { port },
          { ip_protocol: { $regex: new RegExp(`^${ip_protocol}$`, "i") } }, // Case-insensitive protocol match
          { project: project_id }, // Ensure service belongs to correct project
        ],
      };

      const services = await PenPal.DataStore.fetch(
        "CoreAPI",
        "Services",
        selector
      );
      if (services.length === 0) {
        throw new Error(
          `Service not found for host=${host}, port=${port}, protocol=${ip_protocol} in project=${project_id}`
        );
      }
      if (services.length > 1) {
        throw new Error(
          `Multiple services found for host=${host}, port=${port}, protocol=${ip_protocol} in project=${project_id}`
        );
      }

      service = services[0];
      service_id = service.id;
    } else {
      throw new Error("Either service_id or host+port must be provided");
    }

    // Use MongoDB $pull to remove enrichment by plugin_name
    const result = await PenPal.DataStore.updateOne(
      "CoreAPI",
      "Services",
      { id: service_id },
      { $pull: { enrichments: { plugin_name } } }
    );

    // Publish MQTT update
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Update.Services, {
      project: service.project,
      service_ids: [service_id],
    });

    return { success: true, service_id, plugin_name };
  } catch (error) {
    return {
      success: false,
      service_selector,
      plugin_name,
      error: error.message,
    };
  }
};

// -----------------------------------------------------------
// Enrichment File Attachment Functions
//
// These functions provide file attachment capabilities for enrichments.
// Files are stored in FileStore buckets organized by project and plugin.
// File attachments are tracked in the enrichment's `files` array with
// metadata including file type, category, and storage references.
// -----------------------------------------------------------

import {
  FileAttachmentType,
  FileAttachmentCategory,
  detectFileType,
  getFileCategory,
  validateFileType,
  getEnrichmentFileBucket,
} from "../../common/file-attachment-constants.js";

export const attachFileToEnrichment = async (
  service_selector,
  plugin_name,
  file_data,
  file_metadata = {}
) => {
  try {
    // Validate required fields
    if (!plugin_name) {
      throw new Error("plugin_name is required");
    }
    if (!file_data || !file_data.filename || !file_data.buffer) {
      throw new Error("file_data must include filename and buffer");
    }

    // Find the service using either service_id or host/port combination
    let service;
    let service_id;

    if (service_selector.service_id) {
      service_id = service_selector.service_id;
      service = await PenPal.DataStore.fetchOne("CoreAPI", "Services", {
        id: service_id,
      });
      if (!service) {
        throw new Error(`Service not found: ${service_id}`);
      }
    } else if (service_selector.host && service_selector.port) {
      const { host, port, ip_protocol = "tcp", project_id } = service_selector;

      if (!project_id) {
        throw new Error("project_id is required when using host/port lookup");
      }

      let host_id = host;

      // Check if host is an IP address
      if (host.includes(".") || host.includes(":")) {
        const hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
          $and: [{ ip_address: host }, { project: project_id }],
        });

        if (hosts.length === 0) {
          throw new Error(
            `Host not found for IP address=${host} in project=${project_id}`
          );
        }

        if (hosts.length > 1) {
          throw new Error(
            `Multiple hosts found for IP address=${host} in project=${project_id}`
          );
        }

        host_id = hosts[0].id;
      }

      const selector = {
        $and: [
          { host: host_id },
          { port },
          { ip_protocol: { $regex: new RegExp(`^${ip_protocol}$`, "i") } },
          { project: project_id },
        ],
      };

      const services = await PenPal.DataStore.fetch(
        "CoreAPI",
        "Services",
        selector
      );
      if (services.length === 0) {
        throw new Error(
          `Service not found for host=${host}, port=${port}, protocol=${ip_protocol} in project=${project_id}`
        );
      }
      if (services.length > 1) {
        throw new Error(
          `Multiple services found for host=${host}, port=${port}, protocol=${ip_protocol} in project=${project_id}`
        );
      }

      service = services[0];
      service_id = service.id;
    } else {
      throw new Error("Either service_id or host+port must be provided");
    }

    // Find the enrichment to attach file to
    const enrichments = service.enrichments || [];
    const enrichmentIndex = enrichments.findIndex(
      (e) => e.plugin_name === plugin_name
    );

    if (enrichmentIndex === -1) {
      throw new Error(
        `Enrichment not found for plugin ${plugin_name} on service ${service_id}`
      );
    }

    // Detect file type and category
    const detectedType = detectFileType(file_data.filename, file_data.mimeType);
    const fileType = file_metadata.type || detectedType;
    const fileCategory = file_metadata.category || getFileCategory(fileType);

    // Validate file type
    validateFileType(fileType);

    // Create bucket name for this project/plugin combination
    const bucketName = getEnrichmentFileBucket(service.project, plugin_name);

    // Ensure bucket exists
    await PenPal.FileStore.CreateBucket(bucketName);

    // Generate unique filename with timestamp and UUID
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const uuid = PenPal.Utils.UUID();
    const fileExtension = file_data.filename.substring(
      file_data.filename.lastIndexOf(".")
    );
    const storedFilename = `${timestamp}-${uuid}${fileExtension}`;

    // Upload file to FileStore
    const uploadResult = await PenPal.FileStore.UploadFile(
      bucketName,
      storedFilename,
      file_data.buffer,
      {
        originalFilename: file_data.filename,
        mimeType: file_data.mimeType,
        fileType: fileType,
        category: fileCategory,
        pluginName: plugin_name,
        serviceId: service_id,
        attachedAt: new Date().toISOString(),
        ...file_metadata,
      }
    );

    // Create file attachment record
    const fileAttachment = {
      id: PenPal.Utils.UUID(),
      filename: file_data.filename,
      stored_filename: storedFilename,
      bucket_name: bucketName,
      file_type: fileType,
      category: fileCategory,
      size: file_data.buffer.length,
      mime_type: file_data.mimeType,
      uploaded_at: new Date().toISOString(),
      metadata: file_metadata,
    };

    // Add file attachment to enrichment's files array
    const updatedEnrichment = {
      ...enrichments[enrichmentIndex],
      files: [...(enrichments[enrichmentIndex].files || []), fileAttachment],
    };

    // Update the service with the new enrichment containing the file
    enrichments[enrichmentIndex] = updatedEnrichment;

    const result = await PenPal.DataStore.updateOne(
      "CoreAPI",
      "Services",
      { id: service_id },
      { $set: { enrichments } }
    );

    // Publish MQTT update
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Update.Services, {
      project: service.project,
      service_ids: [service_id],
    });

    return {
      success: true,
      file_attachment: fileAttachment,
      upload_result: uploadResult,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getEnrichmentFiles = async (service_selector, plugin_name) => {
  try {
    // Find the service
    let service;
    let service_id;

    if (service_selector.service_id) {
      service_id = service_selector.service_id;
      service = await PenPal.DataStore.fetchOne("CoreAPI", "Services", {
        id: service_id,
      });
      if (!service) {
        throw new Error(`Service not found: ${service_id}`);
      }
    } else if (service_selector.host && service_selector.port) {
      const { host, port, ip_protocol = "tcp", project_id } = service_selector;

      if (!project_id) {
        throw new Error("project_id is required when using host/port lookup");
      }

      let host_id = host;

      if (host.includes(".") || host.includes(":")) {
        const hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
          $and: [{ ip_address: host }, { project: project_id }],
        });

        if (hosts.length !== 1) {
          throw new Error(
            `Host lookup failed for IP ${host} in project ${project_id}`
          );
        }

        host_id = hosts[0].id;
      }

      const selector = {
        $and: [
          { host: host_id },
          { port },
          { ip_protocol: { $regex: new RegExp(`^${ip_protocol}$`, "i") } },
          { project: project_id },
        ],
      };

      const services = await PenPal.DataStore.fetch(
        "CoreAPI",
        "Services",
        selector
      );
      if (services.length !== 1) {
        throw new Error(
          `Service lookup failed for host=${host}, port=${port}, protocol=${ip_protocol}`
        );
      }

      service = services[0];
      service_id = service.id;
    } else {
      throw new Error("Either service_id or host+port must be provided");
    }

    // Find the enrichment
    const enrichments = service.enrichments || [];
    const enrichment = enrichments.find((e) => e.plugin_name === plugin_name);

    if (!enrichment) {
      return { files: [] };
    }

    return { files: enrichment.files || [] };
  } catch (error) {
    return { error: error.message };
  }
};

export const removeFileFromEnrichment = async (file_id) => {
  try {
    // Find the file across all services and enrichments
    const allServices = await PenPal.DataStore.fetch("CoreAPI", "Services", {});

    let foundService = null;
    let foundEnrichmentIndex = -1;
    let foundFileIndex = -1;
    let foundFile = null;

    for (const service of allServices) {
      const enrichments = service.enrichments || [];

      for (
        let enrichmentIndex = 0;
        enrichmentIndex < enrichments.length;
        enrichmentIndex++
      ) {
        const files = enrichments[enrichmentIndex].files || [];

        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
          if (files[fileIndex].id === file_id) {
            foundService = service;
            foundEnrichmentIndex = enrichmentIndex;
            foundFileIndex = fileIndex;
            foundFile = files[fileIndex];
            break;
          }
        }

        if (foundFile) break;
      }

      if (foundFile) break;
    }

    if (!foundFile) {
      throw new Error(`File not found: ${file_id}`);
    }

    // Remove file from FileStore
    await PenPal.FileStore.DeleteFile(
      foundFile.bucket_name,
      foundFile.stored_filename
    );

    // Remove file from enrichment's files array
    const updatedFiles = [
      ...foundService.enrichments[foundEnrichmentIndex].files,
    ];
    updatedFiles.splice(foundFileIndex, 1);

    const updatedEnrichments = [...foundService.enrichments];
    updatedEnrichments[foundEnrichmentIndex] = {
      ...updatedEnrichments[foundEnrichmentIndex],
      files: updatedFiles,
    };

    // Update the service
    const result = await PenPal.DataStore.updateOne(
      "CoreAPI",
      "Services",
      { id: foundService.id },
      { $set: { enrichments: updatedEnrichments } }
    );

    // Publish MQTT update
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Update.Services, {
      project: foundService.project,
      service_ids: [foundService.id],
    });

    return {
      success: true,
      removed_file_id: file_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const generateEnrichmentFileDownloadUrl = async (
  file_id,
  expiry_seconds = 3600
) => {
  try {
    // Find the file across all services and enrichments
    const allServices = await PenPal.DataStore.fetch("CoreAPI", "Services", {});

    let foundFile = null;

    for (const service of allServices) {
      const enrichments = service.enrichments || [];

      for (const enrichment of enrichments) {
        const files = enrichment.files || [];
        const file = files.find((f) => f.id === file_id);

        if (file) {
          foundFile = file;
          break;
        }
      }

      if (foundFile) break;
    }

    if (!foundFile) {
      throw new Error(`File not found: ${file_id}`);
    }

    // Generate download URL
    const downloadUrl = await PenPal.FileStore.GenerateDownloadUrl(
      foundFile.bucket_name,
      foundFile.stored_filename,
      expiry_seconds
    );

    return {
      success: true,
      download_url: downloadUrl,
      expiry: new Date(Date.now() + expiry_seconds * 1000).toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
