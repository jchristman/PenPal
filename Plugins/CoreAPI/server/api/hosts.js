import PenPal from "#penpal/core";
import _ from "lodash";
import ip from "ip";

import { required_field, isTestData } from "./common.js";

import { getNetworksByProject, addHostsToNetwork } from "./networks.js";
//import { hosts as mockHosts } from "../test/mock-hosts.json" assert { type: "json" };
const mockHosts = [];

// -----------------------------------------------------------

export const getHost = async (host_id, options) => {
  const is_test = isTestData(host_id);
  return is_test
    ? _.find(mockHosts, (host) => host.id === host_id)
    : await PenPal.DataStore.fetchOne(
        "CoreAPI",
        "Hosts",
        {
          id: host_id,
        },
        options
      );
};

export const getHosts = async (host_ids, options) => {
  const is_test = isTestData(host_ids);

  return is_test
    ? _.map(host_ids, (id) => _.find(mockHosts, (host) => host.id === id))
    : await PenPal.DataStore.fetch(
        "CoreAPI",
        "Hosts",
        {
          id: { $in: host_ids },
        },
        options
      );
};

export const getHostsPaginationInfo = async (host_ids = [], options) => {
  return await PenPal.DataStore.getPaginationInfo(
    "CoreAPI",
    "Hosts",
    { id: { $in: host_ids } },
    options
  );
};

export const getHostsByProject = async (project_id, options) => {
  const result = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Hosts",
    {
      project: project_id,
    },
    options
  );

  return result;
};

export const getHostsByNetwork = async (network_id, options) => {
  const result = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Hosts",
    {
      network: network_id,
    },
    options
  );

  return result;
};

export const getHostsByNetworks = async (network_ids, options) => {
  const result = await PenPal.DataStore.fetch(
    "CoreAPI",
    "Hosts",
    {
      network: { $in: network_ids },
    },
    options
  );

  return result;
};

// -----------------------------------------------------------

const default_host = {
  hostnames: [],
  services: [],
};

export const insertHost = async (host) => {
  return await insertHosts([host]);
};

export const insertHosts = async (hosts) => {
  let _rejected = [];
  const rejected = [];
  let _accepted = [];
  const accepted = [];

  // Check that each host has appropriate fields
  for (let host of hosts) {
    try {
      required_field(host, "project", "insertion");
      required_field(host, "ip_address", "insertion");

      const _host = { ...host, ...default_host };
      _accepted.push(_host);
    } catch (e) {
      rejected.push({ host, error: e });
    }
  }

  if (_accepted.length > 0) {
    // Find all networks in the project
    const project_networks = (
      await getNetworksByProject(_accepted[0].project)
    ).reduce(
      (sum, network) => ({
        ...sum,
        [network.id]: ip.cidrSubnet(
          `${network.subnet.network_address}/${network.subnet.subnet_mask}`
        ),
      }),
      {}
    );

    // Map each host to a network
    for (let host of _accepted) {
      for (let network_id in project_networks) {
        if (project_networks[network_id].contains(host.ip_address)) {
          host.network = network_id;
        }
      }
    }

    // Reject any hosts that were discovered that were not in any existing scoped networks
    // TODO: probably need to alert on this somehow
    _rejected = _.remove(
      _accepted,
      (host) => host.network === null || host.network === undefined
    );

    // Add the rejected hosts to the rejected array
    for (let host of _rejected) {
      rejected.push({
        host,
        error:
          "Host did not have a matching network. PenPal cannot automatically determine a subnet without further information",
      });
    }

    if (_accepted.length > 0) {
      // Insert the new hosts
      let new_host_ids = await PenPal.DataStore.insertMany(
        "CoreAPI",
        "Hosts",
        _accepted
      );

      // Add the host IDs from the insertion to the data in memory
      const new_hosts = _.zipWith(new_host_ids, _accepted, ({ id }, _host) => ({
        id,
        ..._host,
      }));

      // Update the networks with the new hosts
      const network_new_hosts = _.groupBy(new_hosts, "network");
      for (let network_id in network_new_hosts) {
        if (network_id !== undefined) {
          await addHostsToNetwork(
            network_id,
            network_new_hosts[network_id].map(({ id }) => id)
          );
        }
      }

      // Accept the successful insertions
      accepted.push(...new_hosts);
    } else {
      console.log(rejected);
    }
  }

  // Publish new hosts
  if (accepted.length > 0) {
    const new_host_ids = accepted.map(({ id }) => id);
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.New.Hosts, {
      project: hosts[0].project,
      host_ids: new_host_ids,
    });
  }

  return { accepted, rejected };
};

// -----------------------------------------------------------

export const addServicesToHost = async (host_id, service_ids) => {
  const host = await getHost(host_id);
  host.services.push(...service_ids);
  await updateHost({ id: host_id, services: host.services });
};

export const updateHost = async (host) => {
  return await updateHosts([host]);
};

export const updateHosts = async (hosts) => {
  const rejected = [];
  const _accepted = [];
  const accepted = [];

  for (let host of hosts) {
    try {
      required_field(host, "id", "update");
      _accepted.push(host);
    } catch (e) {
      rejected.push({ host, error: e });
    }
  }

  let matched_hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
    id: { $in: _accepted.map((host) => host.id) },
  });

  if (matched_hosts.length !== _accepted.length) {
    // Find the unknown IDs
    console.error('Implement updateHosts "host not found" functionality');
  }

  for (let { id, ...host } of _accepted) {
    // TODO: Optimize with updateMany
    let res = await PenPal.DataStore.updateOne(
      "CoreAPI",
      "Hosts",
      { id },
      { $set: host }
    );

    accepted.push({ id, ...host });
  }

  if (accepted.length > 0) {
    const updated_host_ids = accepted.map(({ id }) => id);
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Update.Hosts, {
      project: hosts[0].project,
      host_ids: updated_host_ids,
    });
  }

  return { accepted, rejected };
};

// -----------------------------------------------------------

export const upsertHosts = async (project_id, hosts) => {
  const result = [];
  const to_update = [];
  const to_insert = [];
  const rejected = [];

  // Not all data updates are going to have an "id". We need to search from some unique pieces of info that
  // could relate to a host, such as ip address or mac address

  const to_check = [];
  const search_ips = [];
  const search_macs = [];

  for (let host of hosts) {
    if (host.id !== undefined) {
      to_update.push(host);
    } else {
      if (host.ip_address === undefined && host.mac_address === undefined) {
        rejected.push(host);
      } else {
        to_check.push(host);
        if (host.ip_address !== undefined) search_ips.push(host.ip_address);
        if (host.mac_address !== undefined) search_macs.push(host.mac_address);
      }
    }
  }

  let selector = {
    $and: [
      { project: project_id },
      {
        $or: [
          { ip_address: { $in: search_ips } },
          { mac_address: { $in: search_macs } },
        ],
      },
    ],
  };

  let exists = await PenPal.DataStore.fetch("CoreAPI", "Hosts", selector);

  // After this loop, all existing hosts will be set up for an update and `to_check` will only have "new" hosts left
  for (let existing_host of exists) {
    let to_check_host = _.remove(
      to_check,
      (host) =>
        host.ip_address === existing_host.ip_address ||
        host.mac_address === existing_host.mac_address
    );

    if (to_check_host.length === 0) {
      // This really shouldn't happen because it matched the query for the DB
      console.error(
        `Somehow found a host on upsert but it wasn't in the set of hosts passed in?`
      );
      console.error(to_check);
      console.error(existing_host);
    }

    to_update.push({ id: existing_host.id, ...to_check_host[0] });
  }

  for (let host of to_check) {
    to_insert.push(host);
  }

  // Make sure that the project field is present on all hosts
  _.each(to_insert, (host) => {
    host.project = project_id;
  });
  _.each(to_update, (host) => {
    host.project = project_id;
  });

  console.log("To insert", to_insert);
  console.log("To Update", to_update);

  // Do the inserts and updates
  const inserted = await insertHosts(to_insert);
  const updated = await updateHosts(to_update);

  return {
    inserted,
    updated,
    rejected,
  };
};

// -----------------------------------------------------------

export const removeHost = async (host_id) => {
  return await removeHosts([host_id]);
};

export const removeHosts = async (host_ids) => {
  // Get all the host data for hooks so the deleted host hook has some info for notifications and such
  let hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
    id: { $in: host_ids },
  });

  let res = await PenPal.DataStore.delete("CoreAPI", "Hosts", {
    id: { $in: host_ids },
  });

  if (res > 0) {
    const deleted_host_ids = hosts.map(({ id }) => id);
    PenPal.API.MQTT.Publish(PenPal.API.MQTT.Topics.Delete.Hosts, {
      project: hosts[0].project,
      host_ids: deleted_host_ids,
    });

    return true;
  }

  return false;
};
