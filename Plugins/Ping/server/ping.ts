import PenPal from "#penpal/core";
import path from "path";
import fs from "fs";
import { settings } from "./plugin.ts";

interface PingScanOptions {
  project_id: string;
  networks?: string[];
  update_job?: (progress: number, statusText: string) => Promise<void>;
  job_id?: string | null;
}

export const performScan = async (options: PingScanOptions): Promise<void> => {
  const {
    project_id,
    networks = [],
    update_job = async () => {},
    job_id = null,
  } = options;
  const outdir_base = "/penpal-plugin-share";
  const outdir = [outdir_base, "ping", project_id].join(path.sep);
  PenPal.Utils.MkdirP(outdir);

  const targets = networks.join(" ");

  const output_file = [outdir, `output-${PenPal.Utils.Epoch()}.txt`].join(
    path.sep
  );

  const fping_command = `-g ${targets} -a -e 2> ${output_file}`;

  await PenPal.Docker.WaitForImageReady(settings.docker.name, {
    updateCallback: () => {},
    updateMessage: "Waiting for Ping Docker image to build...",
  });

  let result = await PenPal.Docker.Run({
    image: settings.docker.name,
    name: `ping-${project_id}-${PenPal.Utils.Epoch()}`,
    cmd: fping_command,
    daemonize: true,
    volume: {
      name: "penpal_penpal-plugin-share",
      path: outdir_base,
    },
    network: "penpal_penpal",
  });

  let container_id = result.stdout.trim();

  while (true) {
    try {
      const result = await PenPal.Docker.Wait(
        container_id,
        settings.STATUS_SLEEP || 10000
      );
      break;
    } catch (e) {
      if (e.message && e.message.includes("timed out")) {
        // Respect cancellation requests
        if (job_id) {
          const currentJob = await PenPal.Jobs.Get(job_id);
          if (currentJob?.cancellation_request) {
            try {
              await PenPal.Docker.Stop(container_id);
            } catch {}
            await PenPal.Jobs.Cancel(job_id);
            try {
              await PenPal.Docker.RemoveContainer(container_id);
            } catch {}
            return;
          }
        }
        // Update progress if needed
        update_job(50.0, "Scan in progress");
      } else {
        throw e;
      }
    }
  }

  await update_job(100.0, "Scan complete");

  if (job_id) {
    await PenPal.Jobs.Update(job_id, {
      status: PenPal.Jobs.Status.DONE,
      progress: 100.0,
      statusText: "Scan complete",
    });
  }

  await PenPal.Docker.RemoveContainer(container_id);

  // Read and parse output
  const output_data = fs.readFileSync(output_file, "utf8");
  await parseAndUpsertResults(project_id, output_data);
};

export const parseAndUpsertResults = async (project_id, output_data) => {
  const lines = output_data.split("\n");
  const live_hosts = [];

  for (let line of lines) {
    if (line.includes("is alive")) {
      const ip = line.split(" ")[0];
      live_hosts.push({ ip_address: ip });
    }
  }

  if (live_hosts.length > 0) {
    await PenPal.API.Hosts.UpsertMany(project_id, live_hosts);
  }
};
