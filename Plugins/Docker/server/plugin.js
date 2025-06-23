import PenPal from "#penpal/core";
import { check } from "#penpal/common";
import * as DockerImports from "./docker.js";

// Track background build status
const BuildStatus = {
  pending: new Set(),
  building: new Set(),
  completed: new Set(),
  failed: new Set(),
};

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

  if (docker.dockerfile !== undefined || docker.dockercontext !== undefined) {
    if (docker.image !== undefined) {
      console.error(
        `[!] settings.docker is ambiguous - only one of image or dockerfile/dockercontext may be present`
      );
      docker_accept = false;
    }
    if (docker.dockercontext) {
      try_check(docker.dockercontext, String, "dockerfile", "String");
    }
    if (docker.dockerfile) {
      try_check(docker.dockerfile, String, "dockerfile", "String");
    }
  } else if (docker.image !== undefined) {
    try_check(docker.image, String, "image", "String");
  } else {
    console.error(
      `[!] settings.docker must include an image or a dockerfile/dockercontext property`
    );
    docker_accept = false;
  }

  return docker_accept;
};

const build_docker_images_background = async () => {
  const build_docker = async (docker) => {
    if (docker) {
      const imageName = docker.name;

      try {
        BuildStatus.pending.delete(imageName);
        BuildStatus.building.add(imageName);

        if (docker.image) {
          console.log(`[.] Pulling Docker image in background: ${imageName}`);
          await PenPal.Docker.Pull(docker);
        } else {
          console.log(`[.] Building Docker image in background: ${imageName}`);
          await PenPal.Docker.Build(docker);
        }

        BuildStatus.building.delete(imageName);
        BuildStatus.completed.add(imageName);
        console.log(`[+] Background build completed: ${imageName}`);
      } catch (error) {
        BuildStatus.building.delete(imageName);
        BuildStatus.failed.add(imageName);
        console.error(
          `[!] Background build failed for ${imageName}:`,
          error.message
        );
      }
    }
  };

  // Collect all Docker configs first
  const dockerConfigs = [];
  for (let key in PenPal.LoadedPlugins) {
    const { settings: { docker, docker_compose } = {} } =
      PenPal.LoadedPlugins[key];
    if (docker !== undefined) {
      BuildStatus.pending.add(docker.name);
      dockerConfigs.push({ type: "docker", config: docker });
    }
    if (docker_compose !== undefined) {
      dockerConfigs.push({ type: "compose", config: docker_compose });
    }
  }

  // Build all images in parallel
  const buildPromises = dockerConfigs.map(async ({ type, config }) => {
    if (type === "docker") {
      await build_docker(config);
    } else if (type === "compose") {
      await PenPal.Docker.Compose(config);
    }
  });

  await Promise.allSettled(buildPromises);
  console.log(`[+] All background Docker builds completed`);
};

const build_docker_images = async () => {
  // Start building in the background - don't await
  console.log("[.] Starting Docker image builds in background...");

  // Use setTimeout to ensure this runs after the startup hook returns
  setTimeout(() => {
    build_docker_images_background().catch((error) => {
      console.error("[!] Background Docker image building failed:", error);
    });
  }, 0);

  // Return immediately to not block startup
  return;
};

const Docker = {
  loadPlugin() {
    PenPal.Docker = {
      ...DockerImports,
      // Add helper functions to check build status
      GetBuildStatus: () => ({ ...BuildStatus }),
      IsImageReady: (imageName) => BuildStatus.completed.has(imageName),
      IsImageBuilding: (imageName) => BuildStatus.building.has(imageName),
      IsImageFailed: (imageName) => BuildStatus.failed.has(imageName),
    };

    return {
      hooks: {
        settings: { docker: check_docker },
        startup: build_docker_images,
      },
    };
  },
};

export default Docker;
