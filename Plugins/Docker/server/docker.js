import PenPal from "#penpal/core";
import path from "path";
import util from "util";
import fs from "fs";
import pty from "node-pty";
import { v4 as uuid } from "uuid";
import { exec as _exec } from "child_process";
const exec = util.promisify(_exec);

const docker_host = "-H penpal-docker-api:2376";

const check_volume = async (volume) => {
  // check if volume is an object
  if (typeof volume !== "object") {
    console.error(`[!] Volume is not an object: ${volume}`);
    return false;
  }

  // check if volume has a name
  if (!volume.hasOwnProperty("name")) {
    console.error(`[!] Volume name is not set for ${volume}`);
    return false;
  }

  // check if volume has a path
  if (!volume.hasOwnProperty("path")) {
    console.error(`[!] Volume mount path is not set for ${volume.name}`);
    return false;
  }

  // check to see if the volume exists
  const output = await exec(
    `docker ${docker_host} volume inspect ${volume.name}`
  );
  if (output.stderr) {
    console.error(`[!] Volume ${volume.name} does not exist`);
    return false;
  }
  return output;
};

export const Compose = async (args) => {
  await PenPal.Utils.AsyncNOOP();

  process.env.PenPalDockerComposePath = path.relative(
    process.cwd(),
    path.dirname(args.docker_compose_path)
  );

  if (!fs.existsSync(args.docker_compose_path)) {
    console.error(`[!] ${args.docker_compose_path} does not exist`);
    return;
  }

  try {
    let res;

    if (process.env.OFFLINE === "true") {
      console.log(
        `[!!!] Skipping image pull with OFFLINE=true for ${args.name}`
      );
    } else {
      console.log(`[.] Pulling images for compose file: ${args.name}`);
      res = await exec(
        `docker ${docker_host} compose -f ${args.docker_compose_path} pull`
      );
    }

    console.log(`[.] Running compose file: ${args.name}`);
    res = await exec(
      `docker ${docker_host} compose -f ${args.docker_compose_path} up -d --force-recreate`
    );
    console.log(`[+] Compose file now running: ${args.name}`);
  } catch (e) {
    console.error(`[!] Failed to run compose file: ${args.name}`);
    console.error(e);
  }
};

export const Run = async ({
  image,
  cmd,
  daemonize = false,
  network = "",
  volume = null,
}) => {
  await PenPal.Utils.AsyncNOOP();
  if (!check_volume(volume)) {
    console.error(`[!] Improper volume object: ${volume}`);
    return;
  }

  const command_args = [
    daemonize ? "-d" : "",
    network != "" ? `--network ${network}` : "",
    volume ? `-v ${volume.name}:${volume.path}` : "",
    "-it",
  ];
  const command = `docker ${docker_host} run ${command_args.join(
    " "
  )} ${image} ${cmd}`;
  const output = await exec(command);

  return output;
};

export const Wait = async (container_id) => {
  await PenPal.Utils.AsyncNOOP();
  const output = await exec(`docker ${docker_host} wait ${container_id}`);
  return output;
};

export const Start = async (container_id) => {
  await PenPal.Utils.AsyncNOOP();
  const output = await exec(`docker ${docker_host} start ${container_id}`);
  return output;
};

export const Exec = async ({ container, cmd }) => {
  await PenPal.Utils.AsyncNOOP();
  const output = await exec(`docker ${docker_host} exec ${container} ${cmd}`);
  return output;
};

export const Stop = async (container_id) => {
  await PenPal.Utils.AsyncNOOP();
  const output = await exec(`docker ${docker_host} stop ${container_id}`);
  return output;
};

export const RemoveContainer = async (container_id) => {
  await PenPal.Utils.AsyncNOOP();
  const output = await exec(`docker ${docker_host} rm ${container_id}`);
  return output;
};

export const Copy = async ({ container, container_file, output_file }) => {
  await PenPal.Utils.AsyncNOOP();
  const output = await exec(
    `docker ${docker_host} cp ${container}:${container_file} ${output_file}`
  );
  return output;
};

export const Raw = async (cmd) => {
  await PenPal.Utils.AsyncNOOP();
  let res = await exec(`docker ${docker_host} ${cmd}`);
  return res.stdout;
};

export const Pull = async ({ image }) => {
  await PenPal.Utils.AsyncNOOP();
  let output = await exec(`docker ${docker_host} pull ${image}`);
  return output;
};

export const Build = async (args) => {
  await PenPal.Utils.AsyncNOOP();

  if (process.env.OFFLINE === "true") {
    console.log(`[!!!] Skipping build with OFFLINE=true: ${args.name}`);
    return;
  }

  console.log(`[.] Building docker image: ${args.name}`);

  try {
    let res = "";
    if (args.dockercontext !== undefined) {
      res = await exec(
        `docker ${docker_host} build -t ${args.name} ${args.dockercontext}`
      );
    } else {
      res = await exec(
        `docker ${docker_host} build -t ${args.name} -f ${args.dockerfile} .`
      );
    }

    if (res) {
      console.log(`[+] Built image: ${args.name}`);
      return res;
    }
  } catch (e) {
    console.error(`[!] Failed to build image: ${args.name}`);
    console.error(e);
  }

  return null;
};

export const AttachAndReturnDockerChildProcess = async (args) => {
  await PenPal.Utils.AsyncNOOP();

  // Create a PTY
  const term = pty.spawn("bash", [], {
    name: "xterm-256color",
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env,
  });

  // Optionally, you can handle other events like 'exit'
  const exit_listener = term.onExit(({ exitCode, signal }) => {
    //console.log(`PTY exited with code ${exitCode} and signal ${signal}`);
    exit_listener.dispose();
  });

  const command = `docker ${docker_host} attach ${args.container}`;
  term.write(command + "\n");

  return term;
};

export const DetachFromDockerChildProcess = async (term) => {
  // Send Ctrl-p (ASCII code 16) followed by Ctrl-q (ASCII code 17)
  term.write(String.fromCharCode(16)); // Ctrl-p
  term.write(String.fromCharCode(17)); // Ctrl-q
  term.kill();
};

export const CreateTemporaryVolume = async () => {
  await PenPal.Utils.AsyncNOOP();
  const name = `penpal-${uuid()}`;
  const output = await exec(`docker ${docker_host} volume create ${name}`);
  return { name, output };
};

export const DeleteTemporaryVolume = async (name) => {
  await PenPal.Utils.AsyncNOOP();
  const output = await exec(`docker ${docker_host} volume rm ${name}`);
  return output;
};
