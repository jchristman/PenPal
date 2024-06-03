import PenPal from "#penpal/core";
import path from "path";
import fs from "fs";
import xml2js from "xml2js";
import _ from "lodash";

import { settings } from "./plugin.js";

const extractNmapStats = (output) => {
  const statsRegex =
    /Stats:\s(\d+:\d+:\d+)\selapsed;\s(\d+)\shosts\scompleted\s\((\d+)\s(up)\),\s(\d+)\sundergoing((\s\w+)+)/;
  const timingRegex =
    /(\d+\.\d+)%\sdone;\sETC:\s(\d+:\d+)\s\((\d+:\d+:\d+)\sremaining\)/;

  const statsMatch = output.match(statsRegex);
  const timingMatch = output.match(timingRegex);

  if (!statsMatch || !timingMatch) {
    return null; // Unable to extract stats
  }

  const stats = {
    elapsed: statsMatch[1],
    hostsCompleted: parseInt(statsMatch[2]),
    hostsUp: parseInt(statsMatch[3]),
    scanType: statsMatch[6],
    scanProgress: parseFloat(timingMatch[1]),
    etc: timingMatch[2],
    remainingTime: timingMatch[3],
  };

  return stats;
};

const getNmapProgress = async (container_id) => {
  let stats = null;
  // Attach to the container to send a newline to nmap for a progress update
  const terminal = await PenPal.Docker.AttachAndReturnDockerChildProcess({
    container: container_id,
  });
  terminal.onData((data) => {
    console.log(data);
    const extractedStats = extractNmapStats(data);
    if (extractedStats) {
      stats = extractedStats;
    }
  });
  // Press the enter key a few times
  //terminal.write(String.fromCharCode(13));
  //terminal.write(String.fromCharCode(13));
  await PenPal.Utils.Sleep(1500);
  await PenPal.Docker.DetachFromDockerChildProcess(terminal);
  return stats;
};

const parseNmapXml = async (xml_data) => {
  const parser = new xml2js.Parser();
  let parsed_data = await parser.parseStringPromise(xml_data);
  return parsed_data;
};

export const parseAndUpsertResults = async (project_id, xml_data) => {
  // Parse the XML data
  const json_data = await parseNmapXml(xml_data);

  // The hosts are at json_data.nmaprun.host. Get the hosts
  const hosts = json_data?.nmaprun?.host ?? [];
  const live_hosts = {};
  const no_ports_hosts = {};

  // Process each host
  console.log(`[+] Found ${hosts.length} hosts`);
  for (let host of hosts) {
    console.log(`[+] Processing host: ${host.address[0].$.addr}`);
    const ip = host.address[0].$.addr;
    const closed =
      host.ports?.[0].extraports.find(
        (extra_port) => extra_port.$.state === "closed"
      )?.$?.count ?? 0;
    const filtered =
      host.ports?.[0].extraports.find(
        (extra_port) => extra_port.$.state === "filtered"
      )?.$?.count ?? 0;

    const services =
      host.ports?.[0].port?.map((port) => {
        return {
          port: port.$.portid,
          protocol: port.$.protocol,
          service: port.service?.[0].$.name ?? null,
          product: port.service?.[0].$.product ?? null,
          version: port.service?.[0].$.version ?? null,
          extra_info: port.service?.[0].$.extrainfo ?? null,
        };
      }) ?? [];

    if (services.length > 0) {
      live_hosts[ip] = {
        ip_address: ip,
        closed,
        filtered,
        services: services,
      };
    } else {
      no_ports_hosts[ip] = {
        ip_address: ip,
        closed,
        filtered,
        services: services,
      };
    }
  }

  // 1. Upsert Hosts
  let { inserted, updated, rejected } = await PenPal.API.Hosts.UpsertMany(
    project_id,
    Object.keys(live_hosts).map((ip) => ({
      ip_address: ip,
    }))
  );

  const penpal_live_hosts = inserted.accepted.concat(updated.accepted);

  // 2. Add services per host
  let services_result = [];
  for (let host of penpal_live_hosts) {
    const services =
      live_hosts[host.ip_address].services.map((service) => {
        return {
          host: host.id,
          network: host.network,
          project: host.project,
          name: "Nmap Host Discovery Result",
          ip_protocol: service.protocol,
          port: service.port,
          status: "open",
        };
      }) ?? [];

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
    `[+] Upserted ${inserted.accepted.length} hosts, updated ${updated.accepted.length} hosts, inserted ${inserted_services.length} services, updated ${updated_services.length} services`
  );
};

export const performScan = async ({
  project_id,
  ips = [],
  networks = [],
  top_ports = null,
  tcp_ports = [],
  udp_ports = [],
  fast_scan = false,
  outdir_base = "/penpal-plugin-share",
  outfile_prefix = "output",
  update_job = async () => {},
}) => {
  const outdir = [outdir_base, "nmap", project_id].join(path.sep);
  PenPal.Utils.MkdirP(outdir);

  const targets = ips.length > 0 ? ips : networks;

  let ports = "-p";
  if (top_ports !== null) {
    ports = `--top-ports ${top_ports}`;
  } else {
    if (tcp_ports?.length > 0) {
      ports += tcp_ports.join(",");
    }
    if (udp_ports?.length > 0) {
      udp_ports = udp_ports.map((port) => `U:${port}`).join(",");
      ports += `${ports.length > 0 && ","}${udp_ports}`;
    }
  }

  let output_file = [outdir, `${outfile_prefix}-${PenPal.Utils.Epoch()}`].join(
    path.sep
  );
  let output = `-oA ${output_file}`;

  await PenPal.Utils.AsyncNOOP();

  const nmap_command = fast_scan
    ? `-T4 --stats-every 1 -v --max-retries=1 --min-rate 150 --max-scan-delay 5 -n -sS -Pn ${ports} ${output} ${targets}`
    : `${ports} ${output} ${targets}`;

  console.log(`[+] Running nmap ${nmap_command}`);

  // docker run
  let result = await PenPal.Docker.Run({
    image: settings.docker.name,
    cmd: nmap_command,
    daemonize: true,
    volume: {
      name: "penpal_penpal-plugin-share",
      path: outdir_base,
    },
    network: "penpal_penpal",
  });

  // Parse the container ID from the result of the command
  let container_id = result.stdout.trim();
  console.log(`[+] Starting nmap: ${container_id}`);

  // Wait for the container to finish
  while (true) {
    try {
      const result = await PenPal.Utils.AwaitTimeout(
        async () => await PenPal.Docker.Wait(container_id),
        settings.STATUS_SLEEP
      );
      console.log(`[+] nmap finished: ${container_id}`);
      break;
    } catch (e) {
      console.log(`[+] nmap still running: ${container_id}`);
      let stats = await getNmapProgress(container_id);
      if (stats !== null) {
        await update_job(
          stats.scanProgress,
          `Elapsed: ${stats.elapsed}, ${stats.scanType} in progress, ${stats.hostsCompleted} completed / ${stats.hostsUp} up, Remaining: ${stats.remainingTime}`
        );
      }
    }
  }

  await update_job(1.0, "Scan complete");
  console.log(`[+] nmap finished: ${container_id}`);

  // Read the file at ${output}.xml
  const xml_file = `${output_file}.xml`;
  const xml_data = fs.readFileSync(xml_file, "utf8");

  await PenPal.Docker.RemoveContainer(container_id);
  await parseAndUpsertResults(project_id, xml_data);
};
