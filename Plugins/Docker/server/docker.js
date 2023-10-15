import PenPal from "#penpal/core";
import path from "path";
import Docker from "dockerode";
import util from "util";
import { exec as _exec } from "child_process";
const exec = util.promisify(_exec);

// Doesn't support "compose"
const docker = new Docker({ host: "http://penpal-docker-api", port: 2376 });

export const dockerCompose = async (args) => {
  await PenPal.Utils.AsyncNOOP();

  process.env.PenPalDockerComposePath = path.relative(
    process.cwd(),
    path.dirname(args.docker_compose_path)
  );

  try {
    console.log(`[.] Pulling images for compose file: ${args.name}`);
    let res = await exec(
      `docker -H penpal-docker-api:2376 compose -f ${args.docker_compose_path} pull`
    );

    console.log(`[.] Running compose file: ${args.name}`);
    res = await exec(
      `docker -H penpal-docker-api:2376 compose -f ${args.docker_compose_path} up -d --force-recreate`
    );
    console.log(`[+] Compose file now running: ${args.name}`);
  } catch (e) {
    console.error(`[!] Failed to run compose file: ${args.name}`);
    console.error(e);
  }
};

export const dockerExec = async (args) => {
  await PenPal.Utils.AsyncNOOP();
  let res = await exec(`docker -H penpal-docker-api:2376 run --rm ${args}`);
  return res.stdout;
};

export const dockerRawExec = async (args) => {
  await PenPal.Utils.AsyncNOOP();
  let res = await exec(`docker -H penpal-docker-api:2376 ${args}`);
  return res.stdout;
};

export const dockerBuild = async (args) => {
  await PenPal.Utils.AsyncNOOP();

  console.log(`[.] Building docker image: ${args.name}`);

  try {
    let res = "";
    if (args.dockercontext !== undefined) {
      res = await exec(
        `docker -H penpal-docker-api:2376 build -t ${args.name} ${args.dockercontext}`
      );
    } else {
      res = await exec(
        `docker -H penpal-docker-api:2376 build -t ${args.name} -f ${args.dockerfile} .`
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
