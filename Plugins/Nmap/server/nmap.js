import PenPal from "#penpal/core";
import path from "path";
import fs from "fs";
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
  // Attach to the container to send a newline to nmap for a progress update
  const terminal = await PenPal.Docker.AttachAndReturnDockerChildProcess({
    container: container_id,
  });
  terminal.onData((data) => {
    const extractedStats = extractNmapStats(data);
    if (extractedStats) {
      console.log(JSON.stringify(extractedStats, null, 2));
    }
  });
  terminal.write(String.fromCharCode(13));
  await PenPal.Utils.Sleep(1000);
  await PenPal.Docker.DetachFromDockerChildProcess(terminal);
};

export const performScan = async ({
  project_id,
  ips = [],
  networks = [],
  top_ports = null,
  tcp_ports = [],
  udp_ports = [],
  fast_scan = false,
  outfile = "output.xml",
}) => {
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
  let output = `-oX /working/${outfile}`;

  await PenPal.Utils.AsyncNOOP();

  const nmap_command = fast_scan
    ? `-T5 -n -sS -Pn ${ports} ${targets}`
    : `${ports} ${targets}`;

  console.log(`[+] Running nmap ${nmap_command}`);

  // docker run
  let result = await PenPal.Docker.Run({
    image: settings.docker.name,
    cmd: nmap_command,
    daemonize: true,
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
        5000
      );
      console.log(`[+] nmap finished: ${container_id}`);
      break;
    } catch (e) {
      console.log(`[+] nmap still running: ${container_id}`);
      await getNmapProgress(container_id);
    }
  }

  console.log(`[+] nmap finished: ${container_id}`);

  // Re-start the container to copy files out
  await PenPal.Docker.Start(container_id);

  // Execute 'ls' to get the list of JSON files from nmap
  result = await PenPal.Docker.Exec({
    container: container_id,
    cmd: `/bin/sh -c 'ls'`,
  });

  console.log(`ls result: ${result.stdout}`);

  result = await PenPal.Docker.Exec({
    container: container_id,
    cmd: `/bin/sh -c 'cat ${outfile} | jc --xml -p'`,
  });

  console.log(`jc result: ${result.stdout}`);

  // Set up an object to hold all the data
  // let merged_data = {};
  // if (result.stdout.length !== 0) {
  //   console.log(`[.] Copying JSON files from nmap container: ${container_id}`);
  //   const files = result.stdout.split("\n");
  //   const outdir = [PenPal.Constants.TMP_DIR, container_id].join(path.sep);
  //   PenPal.Utils.MkdirP(outdir);

  //   for (let file of files) {
  //     if (file.length === 0) {
  //       continue;
  //     }

  //     // docker cp file to a temp dir
  //     const outfile = [outdir, file].join(path.sep);
  //     await PenPal.Docker.Copy({
  //       container: container_id,
  //       container_file: `/working/${file}`,
  //       output_file: outfile,
  //     });

  //     // Read the JSON and merge it into a single object
  //     try {
  //       const data = JSON.parse(fs.readFileSync(outfile, "utf8"));
  //       merged_data = { ...merged_data, ...data };
  //     } catch (e) {
  //       console.log(`[!] failed to read data from ${outfile}`);
  //       console.error(e.message);
  //       console.error(e.stack);
  //     }
  //   }

  //   console.log(
  //     `[.] Copied results for ${Object.keys(merged_data).length} IP addresses`
  //   );
  // } else {
  //   console.log(`[.] No results for nmap: ${container_id}`);
  // }
  await PenPal.Docker.Stop(container_id);
  await PenPal.Docker.RemoveContainer(container_id);

  // await parseResults(project_id, merged_data);
};
