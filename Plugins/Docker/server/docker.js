import PenPal from "#penpal/core";
import { exec } from "child_process";
import fs from "fs";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const runCommand = (args) => {
  return new Promise((resolve, reject) => {
    exec(`${args}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }

      if (stdout === null || stdout === "") {
        resolve(`${stderr}`);
      } else {
        console.log(`[.] Resolving with stdout: ${stdout}`);
        resolve(`${stdout}`);
      }
    });
  });
};

export const dockerCompose = async (args) => {
  await PenPal.Utils.AsyncNOOP();

  try {
    console.log(`[.] Pulling images for compose file: ${args.name}`);
    let res = await runCommand(
      `sudo docker compose -f ${args.docker_compose_path} pull`
    );

    console.log(`[.] Running compose file: ${args.name}`);
    res = await runCommand(
      `sudo docker compose -f ${args.docker_compose_path} up -d --force-recreate`
    );

    console.log(`[+] Compose file now running: ${args.name}`);
  } catch (e) {
    console.error(`[!] Failed to run compose file: ${args.name}`);
    console.error(e);
  }
};

export const dockerExec = async (args) => {
  await PenPal.Utils.AsyncNOOP();
  let res = await runCommand(`sudo docker run --rm ${args}`);
  return res;
};

export const dockerBuild = async (args) => {
  await PenPal.Utils.AsyncNOOP();

  console.log(`[.] Building docker image: ${args.name}`);

  try {
    const res = await runCommand(
      `sudo echo """${args.dockerfile}""" > Dockerfile-${args.name} && sudo docker build -t ${args.name} -f Dockerfile-${args.name} . && sudo rm -f Dockerfile-${args.name}`
    );

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
