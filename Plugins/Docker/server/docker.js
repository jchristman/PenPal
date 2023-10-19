import PenPal from "#penpal/core";
import path from "path";
import util from "util";
import fs from "fs";
import { exec as _exec } from "child_process";
const exec = util.promisify(_exec);

const docker_host = "-H penpal-docker-api:2376";

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
    console.log(`[.] Pulling images for compose file: ${args.name}`);
    let res = await exec(
      `docker ${docker_host} compose -f ${args.docker_compose_path} pull`
    );

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

export const Run = async ({ image, cmd, daemonize = false, network = "" }) => {
  await PenPal.Utils.AsyncNOOP();

  const command = `docker ${docker_host} run ${daemonize ? "-d " : ""}${
    network != "" ? `--network ${network} ` : ""
  }${image} ${cmd}`;
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

export const Build = async (args) => {
  await PenPal.Utils.AsyncNOOP();

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
