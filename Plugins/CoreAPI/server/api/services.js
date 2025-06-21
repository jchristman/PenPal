import PenPal from "#penpal/core";
import _ from "lodash";

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
    console.error('Implement updateServices "service not found" functionality');
    console.log(_accepted, matched_services);
  }

  for (let { id, ...service } of _accepted) {
    // TODO: Optimize with updateMany
    console.log("Update service", id, service);
    let res = await PenPal.DataStore.updateOne(
      "CoreAPI",
      "Services",
      { id },
      { $set: service }
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
    let selector = {
      $and: [
        { host: service.host },
        { ip_protocol: service.ip_protocol },
        { port: service.port },
      ],
    };

    let exists = await PenPal.DataStore.fetch("CoreAPI", "Services", selector);
    if (exists.length > 0) {
      to_update.push({ id: exists[0].id, ...service });

      // Splice and decrement the counter to account for the changed length of the array
      services.splice(i, 1);
      i--;
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
