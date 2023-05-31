import PenPal from "#penpal/core";
import _ from "lodash";

import { required_field, isTestData } from "./common.js";
//import { networks as mockNetworks } from "../test/mock-networks.json" assert { type: "json" };
const mockNetworks = [];
// import {
//   newNetworkHooks,
//   deletedNetworkHooks,
//   updatedNetworkHooks,
// } from "./hooks.js";

// -----------------------------------------------------------

export const getNetwork = async (network_id) => {
  const is_test = isTestData(network_id);
  return is_test
    ? _.find(mockNetworks, (network) => network.id === network_id)
    : await PenPal.DataStore.fetchOne("CoreAPI", "Networks", {
        id: network_id,
      });
};

export const getNetworks = async (network_ids) => {
  const is_test = isTestData(network_ids);

  return is_test
    ? _.map(network_ids, (id) =>
        _.find(mockNetworks, (network) => network.id === id)
      )
    : await PenPal.DataStore.fetch("CoreAPI", "Networks", {
        id: { $in: network_ids },
      });
};

export const getNetworksPaginationInfo = async (network_ids = [], options) => {
  return await PenPal.DataStore.getPaginationInfo(
    "CoreAPI",
    "Networks",
    { id: { $in: network_ids } },
    options
  );
};

export const getNetworksByProject = async (project_id) => {
  const result = await PenPal.DataStore.fetch("CoreAPI", "Networks", {
    project: project_id,
  });

  return result;
};

// -----------------------------------------------------------

const default_network = {
  hosts: [],
};

export const insertNetwork = async (network) => {
  return await insertNetworks([network]);
};

export const insertNetworks = async (networks) => {
  const rejected = [];
  const _accepted = [];
  const accepted = [];

  for (let network of networks) {
    try {
      required_field(network, "project", "insertion");
      required_field(network, "subnet", "insertion");

      const _network = { ...network, ...default_network };
      _accepted.push(_network);
    } catch (e) {
      rejected.push({ network, error: e });
    }
  }

  if (_accepted.length > 0) {
    let result = await PenPal.DataStore.insertMany(
      "CoreAPI",
      "Networks",
      _accepted
    );
    accepted.push(...result);
  }

  if (accepted.length > 0) {
    const new_network_ids = networks.map(({ id }) => id);
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.New.Networks, {
      project: networks[0].project,
      network_ids: new_network_ids,
    });
  }

  return { accepted, rejected };
};

// -----------------------------------------------------------

export const updateNetwork = async (network) => {
  return await updateNetworks([network]);
};

export const updateNetworks = async (networks) => {
  const rejected = [];
  const _accepted = [];
  const accepted = [];

  for (let network of networks) {
    try {
      required_field(network, "id", "update");
      _accepted.push(network);
    } catch (e) {
      rejected.push({ network, error: e });
    }
  }

  let matched_networks = await PenPal.DataStore.fetch("CoreAPI", "Networks", {
    id: { $in: _accepted.map((network) => network.id) },
  });

  if (matched_networks.length !== _accepted.length) {
    // Find the unknown IDs
    console.error('Implement updateNetworks "network not found" functionality');
  }

  for (let { id, ...network } of _accepted) {
    // TODO: Optimize with updateMany
    let res = await PenPal.DataStore.updateOne(
      "CoreAPI",
      "Networks",
      { id },
      { $set: network }
    );

    if (res > 0) accepted.push({ id, ...network });
  }

  if (accepted.length > 0) {
    const updated_network_ids = networks.map(({ id }) => id);
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Update.Networks, {
      project: networks[0].project,
      network_ids: updated_network_ids,
    });
  }

  return { accepted, rejected };
};

export const addHostsToNetwork = async (network_id, host_ids) => {
  const network = await getNetwork(network_id);
  network.hosts.push(...host_ids);
  await updateNetwork({ id: network_id, hosts: network.hosts });
};

// -----------------------------------------------------------

export const removeNetwork = async (network_id) => {
  return await removeNetworks([network_id]);
};

export const removeNetworks = async (network_ids) => {
  // Get all the network data for hooks so the deleted network hook has some info for notifications and such
  let networks = await PenPal.DataStore.fetch("CoreAPI", "Networks", {
    id: { $in: network_ids },
  });

  let res = await PenPal.DataStore.delete("CoreAPI", "Networks", {
    id: { $in: network_ids },
  });

  if (res > 0) {
    const deleted_network_ids = networks.map(({ id }) => id);
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Delete.Networks, {
      project: networks[0].project,
      network_ids: deleted_network_ids,
    });

    return true;
  }

  return false;
};
