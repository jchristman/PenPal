import PenPal from "meteor/penpal";
import _ from "lodash";
import ip from "ip";

import { required_field, isTestData } from "./common.js";

import { getNetworksByProject, addHostsToNetwork } from "./networks.js";
import { hosts as mockHosts } from "../test/mock-hosts.json";
import { newHostHooks, deletedHostHooks, updatedHostHooks } from "./hooks.js";

// -----------------------------------------------------------

export const getHost = async (host_id, options) => {
  const is_test = isTestData(host_id);
  return is_test
    ? _.find(mockHosts, (host) => host.id === host_id)
    : await PenPal.DataStore.fetchOne(
        "CoreAPI",
        "Hosts",
        {
          id: host_id
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
          id: { $in: host_ids }
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
      project: project_id
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
      network: network_id
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
      network: { $in: network_ids }
    },
    options
  );

  return result;
};

// -----------------------------------------------------------

const default_host = {
  hostnames: [],
  services: []
};

export const insertHost = async (host) => {
  return await insertHosts([host]);
};

export const insertHosts = async (hosts) => {
  const rejected = [];
  const _accepted = [];
  const accepted = [];

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
    const project_networks = (
      await getNetworksByProject(_accepted[0].project)
    ).reduce(
      (sum, network) => ({
        ...sum,
        [network.id]: ip.cidrSubnet(
          `${network.subnet.network_address}/${network.subnet.subnet_mask}`
        )
      }),
      {}
    );

    for (let host of _accepted) {
      for (let network_id in project_networks) {
        if (project_networks[network_id].contains(host.ip_address)) {
          host.network = network_id;
        }
      }
    }

    let new_host_ids = await PenPal.DataStore.insertMany(
      "CoreAPI",
      "Hosts",
      _accepted
    );

    const new_hosts = _.zipWith(new_host_ids, _accepted, ({ id }, _host) => ({
      id,
      ..._host
    }));

    const network_new_hosts = _.groupBy(new_hosts, "network");
    for (let network_id in network_new_hosts) {
      if (network_id !== undefined) {
        await addHostsToNetwork(
          network_id,
          network_new_hosts[network_id].map(({ id }) => id)
        );
      }
    }

    accepted.push(...new_hosts);
  }

  if (accepted.length > 0) {
    const new_host_ids = accepted.map(({ id }) => id);
    newHostHooks(hosts[0].project, new_host_ids);
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
    id: { $in: _accepted.map((host) => host.id) }
  });

  if (matched_hosts.length !== _accepted.length) {
    // Find the unknown IDs
    console.error('Implement updateHosts "host not found" functionality');
  }

  for (let { id, ...host } of _accepted) {
    // TODO: Needs some work, but I'd prefer to update the datastore layer than here
    let res = await PenPal.DataStore.update(
      "CoreAPI",
      "Hosts",
      { id },
      { $set: host }
    );

    if (res > 0) accepted.push({ id, ...host });
  }

  if (accepted.length > 0) {
    updatedHostHooks(accepted);
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
          { mac_address: { $in: search_macs } }
        ]
      }
    ]
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

    to_update.push(to_check_host[0]);
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

  // Do the inserts and updates
  const inserted = await insertHosts(to_insert);
  const updated = await updateHosts(to_update);

  return {
    inserted,
    updated,
    rejected
  };
};

// -----------------------------------------------------------

export const removeHost = async (host_id) => {
  return await removeHosts([host_id]);
};

export const removeHosts = async (host_ids) => {
  // Get all the host data for hooks so the deleted host hook has some info for notifications and such
  let hosts = await PenPal.DataStore.fetch("CoreAPI", "Hosts", {
    id: { $in: host_ids }
  });

  let res = await PenPal.DataStore.delete("CoreAPI", "Hosts", {
    id: { $in: host_ids }
  });

  if (res > 0) {
    deletedHostHooks(hosts);
    return true;
  }

  return false;
};
