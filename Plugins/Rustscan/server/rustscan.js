import PenPal from "#penpal/core";
import path from "path";
import fs from "fs";
import _ from "lodash";

export const parseResults = async (project_id, data) => {
  console.log("[.] Parsing rustscan results");

  let res = {
    status: "Error Uploading Data",
    was_success: false,
    affected_records: [],
  };

  const ips = Object.keys(data);
  let hosts = _.map(ips, (ip) => {
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
      data[host.ip_address]?.map((port_info) => {
        return {
          host: host.id,
          network: host.network,
          project: host.project,
          name: "Rustscan Host Discovery Result",
          ip_protocol: "TCP",
          port: port_info,
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
    `[+] Rustscan inserted ${inserted.accepted.length} hosts, updated ${updated.accepted.length} hosts, inserted ${inserted_services.length} services, updated ${updated_services.length} services`
  );

  // TODO: Check out updated and rejected

  return { inserted, updated, rejected };
};

export const performDiscoveryScan = async (args) => {
  const targets = (args.ips?.length ?? 0) > 0 ? args.ips : args.networks;

  console.log(
    `[.] Starting Discovery rustscan for ${targets.length} ${
      (args.ips?.length ?? 0) > 0 ? "IPs" : "Networks"
    } in ${args.project_id}`
  );

  return await performScan(args);
};

export const performDetailedScan = async (args) => {
  const targets = (args.ips?.length ?? 0) > 0 ? args.ips : args.networks;

  console.log(
    `[.] Starting Detailed rustscan for ${targets.length} ${
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

  // rustscan -a TARGETS -p PORTS --scripts custom
  const rustscan_command = `-a ${targets} ${ports} --scripts custom`;

  // docker run
  let result = await PenPal.Docker.Run({
    image: "penpal:rustscan",
    cmd: rustscan_command,
    daemonize: true,
    network: "penpal_penpal",
  });

  // Parse the container ID from the result of the command
  let container_id = result.stdout.trim();
  console.log(`[+] Starting Rustscan: ${container_id}`);

  // Wait for the container to finish
  await PenPal.Docker.Wait(container_id);
  console.log(`[+] Rustscan finished: ${container_id}`);

  // Re-start the container to copy files out
  await PenPal.Docker.Start(container_id);

  // Execute 'ls' to get the list of JSON files from rustscan
  result = await PenPal.Docker.Exec({
    container: container_id,
    cmd: `/bin/sh -c 'ls'`,
  });

  // Set up an object to hold all the data
  let merged_data = {};
  if (result.stdout.length !== 0) {
    console.log(
      `[.] Copying JSON files from Rustscan container: ${container_id}`
    );
    const files = result.stdout.split("\n");
    const outdir = [PenPal.Constants.TMP_DIR, container_id].join(path.sep);
    PenPal.Utils.MkdirP(outdir);

    for (let file of files) {
      if (file.length === 0) {
        continue;
      }

      // docker cp file to a temp dir
      const outfile = [outdir, file].join(path.sep);
      await PenPal.Docker.Copy({
        container: container_id,
        container_file: `/working/${file}`,
        output_file: outfile,
      });

      // Read the JSON and merge it into a single object
      try {
        const data = JSON.parse(fs.readFileSync(outfile, "utf8"));
        merged_data = { ...merged_data, ...data };
      } catch (e) {
        console.log(`[!] failed to read data from ${outfile}`);
        console.error(e.message);
        console.error(e.stack);
      }
    }

    console.log(
      `[.] Copied results for ${Object.keys(merged_data).length} IP addresses`
    );
  } else {
    console.log(`[.] No results for Rustscan: ${container_id}`);
  }
  await PenPal.Docker.Stop(container_id);
  await PenPal.Docker.RemoveContainer(container_id);

  await parseResults(project_id, merged_data);
};
