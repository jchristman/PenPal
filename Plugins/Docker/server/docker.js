import PenPal from "meteor/penpal";
import { exec } from "child_process";

const runCommand = (args) => {
  return new Promise((resolve, reject) => {
    exec(`${args}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(`${stdout}`);
    });
  });
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
