import PenPal from "meteor/penpal";
import { check, Match } from "meteor/check";
import { dockerExec, dockerBuild, dockerRun } from "./docker.js";

const check_docker = (docker) => {
  let docker_accept = true;

  const try_check = (value, type, repr_value, repr_type) => {
    try {
      check(value, type);
    } catch (e) {
      console.error(
        `[!] settings.docker.${repr_value} must be of type ${repr_type}`
      );
      docker_accept = false;
    }
  };

  try_check(docker.name, String, "name", "String");

  if (docker.dockerfile !== undefined) {
    if (docker.image !== undefined) {
      console.error(
        `[!] settings.docker is ambiguous - only one of image or dockerfile may be present`
      );
      docker_accept = false;
    }
    try_check(docker.dockerfile, String, "dockerfile", "String");
  } else if (docker.image !== undefined) {
    try_check(docker.image, String, "image", "String");
  } else {
    console.error(
      `[!] settings.docker must include an image or a dockerfile property`
    );
    docker_accept = false;
  }

  return docker_accept;
};

const build_docker_images = async () => {
  const build_docker = async (docker) => {
    if (docker) {
      await PenPal.Docker.Build(docker);
    }
  };

  for (let key in PenPal.LoadedPlugins) {
    const { settings: { docker } = {} } = PenPal.LoadedPlugins[key];
    if (docker === undefined) continue;
    await build_docker(docker);
  }
};

const Docker = {
  loadPlugin() {
    PenPal.Docker = {
      Exec: dockerExec,
      Build: dockerBuild
    };

    return {
      hooks: {
        settings: { docker: check_docker },
        startup: build_docker_images
      }
    };
  }
};

export default Docker;
