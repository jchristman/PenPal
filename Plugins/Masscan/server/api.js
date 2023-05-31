import PenPal from "#penpal/core";
import hjson from "hjson";
import _ from "lodash";
import { json } from "stream/consumers";

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

  let parsedJson = hjson.parse(jsonData.toString());

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
  let services_count = 0;
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
      services_count += services.length;
      await PenPal.API.Services.InsertMany(services);
    }
  }

  console.log(
    `[+] Masscan inserted ${valid_hosts.length} hosts, ${services_count} services`
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

export const performMasscan = async ({
  project_id,
  ips,
  tcp_ports = [],
  udp_ports = [],
  ping = false,
  scan_rate = 1000,
}) => {
  console.log(`[.] Starting masscan for ${ips.length} IPs in ${project_id}`);

  let ports = "";
  if (tcp_ports?.length > 0) {
    ports += tcp_ports;
  }
  if (udp_ports?.length > 0) {
    const udp_ports = udp_ports
      .split(",")
      .map((port) => `U:${port}`)
      .join(",");
    ports += `${ports.length > 0 && ","}${udp_ports}`;
  }

  const command = `masscan "masscan -oJ res.json --rate=${scan_rate} -p${ports}${
    ping ? " --ping" : ""
  } ${ips} 1>&2 2>/dev/null && cat res.json"`;

  await PenPal.Utils.AsyncNOOP();

  PenPal.Docker.Exec(command).then((res, err) => {
    if (err) {
      console.log(err);
      return response;
    }
    const buff = Buffer.from(res, "utf-8");
    parseMasscan(project_id, buff.toString());
  });
};
