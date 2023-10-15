import PenPal from "#penpal/core";
import _ from "lodash";
import fs from "fs";

function customizer(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

export const parseMasscan = async (project_id, jsonData) => {
  console.log("[.] Parsing masscan results");

  let res = {
    status: "Error Uploading Data",
    was_success: false,
    affected_records: [],
  };

  let parsedJson = {};
  try {
    parsedJson = hjson.parse(jsonData.toString());
  } catch (e) {
    console.error("Bad results:");
    console.error(jsonData);
    return;
  }

  const ips = _.reduce(
    parsedJson,
    (result, value) => {
      if (result[value.ip] === undefined) {
        result[value.ip] = value;
      } else {
        _.mergeWith(result[value.ip], value, customizer);
      }
      return result;
    },
    {}
  );

  let hosts = _.map(ips, ({ ip }) => {
    return { ip_address: ip };
  });

  if (hosts.length === 0) {
    return { inserted: [], updated: [], rejected: [] };
  }

  // 1. Upsert Hosts
  let { inserted, updated, rejected } = await PenPal.API.Hosts.UpsertMany(
    project_id,
    hosts
  );

  const valid_hosts = inserted.accepted.concat(updated.accepted);

  // 2. Add services per host...
  let services_result = [];
  for (let host of valid_hosts) {
    const services =
      ips[host.ip_address]?.ports?.map((port_info) => ({
        host: host.id,
        network: host.network,
        project: host.project,
        name: "Masscan Host Discovery Result",
        ip_protocol: port_info.proto,
        port: port_info.port,
        status: port_info.status,
        ttl: port_info.ttl,
      })) ?? [];

    if (services.length > 0) {
      services_result.push(await PenPal.API.Services.UpsertMany(services));
    }
  }

  // Process services stats for console log
  let inserted_services = [],
    updated_services = [];
  for (let {
    inserted: tmp_inserted,
    updated: tmp_updated,
  } of services_result) {
    inserted_services = inserted_services.concat(tmp_inserted.accepted);
    updated_services = updated_services.concat(tmp_updated.accepted);
  }

  console.log(
    `[+] Masscan inserted ${inserted.accepted.length} hosts, updated ${updated.accepted.length} hosts, inserted ${inserted_services.length} services, updated ${updated_services.length} services`
  );

  // TODO: Check out updated and rejected

  //let servicesArray = [];
  //_.each(hostRecords, (host) => {
  //  _.each(ips[host.ipv4].ports, (foundPort) => {
  //    servicesArray.push({
  //      hostID: host._id._str,
  //      port: foundPort.port,
  //      protocol: foundPort.proto
  //    });
  //  });
  //});

  //let servicesResp = await PenPal.API.Services.Upsert({
  //  project_id: project_id,
  //  services: servicesArray
  //});

  //if (servicesResp.affected_records.length > 0) {
  //  res = {
  //    status: "Services Created",
  //    was_success: true,
  //    affected_records: servicesResp.affected_records
  //  };
  //}

  return { inserted, updated, rejected };
};

export const performDiscoveryScan = async (args) => {
  const targets = (args.ips?.length ?? 0) > 0 ? args.ips : args.networks;

  console.log(
    `[.] Starting Discovery masscan for ${targets.length} ${
      (args.ips?.length ?? 0) > 0 ? "IPs" : "Networks"
    } in ${args.project_id}`
  );

  return await performScan(args);
};

export const performDetailedScan = async (args) => {
  const targets = (args.ips?.length ?? 0) > 0 ? args.ips : args.networks;

  console.log(
    `[.] Starting Detailed masscan for ${targets.length} ${
      (args.ips?.length ?? 0) > 0 ? "IPs" : "Networks"
    } in ${args.project_id}`
  );

  return await performScan(args);
};

export const performScan = async ({
  project_id,
  ips = [],
  networks = [],
  top_ports = null,
  tcp_ports = [],
  udp_ports = [],
}) => {
  const targets = ips.length > 0 ? ips : networks;

  let ports = "-p";
  if (top_ports !== null) {
    ports = `--top`;
  } else {
    if (tcp_ports?.length > 0) {
      ports += tcp_ports.join(",");
    }
    if (udp_ports?.length > 0) {
      udp_ports = udp_ports.map((port) => `U:${port}`).join(",");
      ports += `${ports.length > 0 && ","}${udp_ports}`;
    }
  }

  await PenPal.Utils.AsyncNOOP();

  const rustscan_command = `rustscan -a ${targets} ${ports} --scripts custom`;
  console.log("Starting Scan");
  let container_id = await PenPal.Docker.RawExec(
    `run --network penpal_penpal -d rustscan-python "${rustscan_command}"`
  );
  container_id = container_id.trim();
  console.log("Waiting on Scan");
  await PenPal.Docker.RawExec(`wait "${container_id}"`);
  console.log("Getting Files List from Container");
  await PenPal.Docker.RawExec(`start "${container_id}"`);
  const files = await PenPal.Docker.RawExec(
    `exec "${container_id}" /bin/sh -c 'ls'`
  );
  console.log(files);
  console.log("Stopping Container");
  await PenPal.Docker.RawExec(`stop "${container_id}"`);
  console.log("Removing container");
  await PenPal.Docker.RawExec(`container rm "${container_id}"`);
};
