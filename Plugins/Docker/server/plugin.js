import PenPal from "#penpal/core";
import { check } from "#penpal/common";
import * as DockerImports from "./docker.js";

// File-level logger that can be imported by other files
export const DockerLogger = PenPal.Utils.BuildLogger("Docker");

const check_docker = (docker) => {
  let docker_accept = true;

  const try_check = (value, type, repr_value, repr_type) => {
    try {
      check(value, type);
    } catch (e) {
      DockerLogger.error(
        `settings.docker.${repr_value} must be of type ${repr_type}`
      );
      docker_accept = false;
    }
  };

  try_check(docker.name, String, "name", "String");

  if (docker.dockerfile !== undefined || docker.dockercontext !== undefined) {
    if (docker.image !== undefined) {
      DockerLogger.error(
        `settings.docker is ambiguous - only one of image or dockerfile/dockercontext may be present`
      );
      docker_accept = false;
    }

    try_check(docker.dockerfile, String, "dockerfile", "String");
    try_check(docker.dockercontext, String, "dockercontext", "String");
  } else if (docker.image !== undefined) {
    try_check(docker.image, String, "image", "String");
  } else {
    DockerLogger.error(
      `settings.docker must include an image or a dockerfile/dockercontext property`
    );
    docker_accept = false;
  }

  return docker_accept;
};

const build_docker_images = async () => {
  // Start building in the background - don't await
  DockerLogger.log("Starting Docker image builds in background...");

  // Use setTimeout to ensure this runs after the startup hook returns
  setTimeout(() => {
    build_docker_images_background().catch((error) => {
      DockerLogger.error("Background Docker image building failed:", error);
    });
  }, 0);

  // Return immediately to not block startup
  return;
};

const build_docker_images_background = async () => {
  const build_docker = async (docker) => {
    if (docker) {
      const imageName = docker.name;

      try {
        BuildStatus.pending.delete(imageName);
        BuildStatus.building.add(imageName);

        if (docker.image) {
          DockerLogger.log(`Pulling Docker image in background: ${imageName}`);
          await PenPal.Docker.Pull(docker);
        } else {
          DockerLogger.log(`Building Docker image in background: ${imageName}`);
          await PenPal.Docker.Build(docker);
        }

        BuildStatus.building.delete(imageName);
        BuildStatus.completed.add(imageName);
        DockerLogger.log(`Background build completed: ${imageName}`);
      } catch (error) {
        BuildStatus.building.delete(imageName);
        BuildStatus.failed.add(imageName);
        DockerLogger.error(`Background build failed for ${imageName}:`, error);
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
  DockerLogger.log(`All background Docker builds completed`);
};

// Build status tracking
const BuildStatus = {
  pending: new Set(),
  building: new Set(),
  completed: new Set(),
  failed: new Set(),
};

const DockerPlugin = {
  async loadPlugin() {
    // Validate Docker settings for all plugins
    const plugins_with_docker = Object.values(PenPal.RegisteredPlugins).filter(
      (plugin) => plugin.plugin?.settings?.docker
    );

    for (const plugin of plugins_with_docker) {
      const docker_config = plugin.plugin.settings.docker;
      if (!check_docker(docker_config)) {
        DockerLogger.error(
          `Invalid Docker configuration for plugin ${plugin.name}@${plugin.version}`
        );
        throw new Error(
          `Docker configuration validation failed for ${plugin.name}`
        );
      }

      // Add to pending builds
      BuildStatus.pending.add(docker_config.name);
    }

    // Register Docker API
    PenPal.Docker = {
      ...DockerImports,
      // Add build status tracking functions
      IsImageReady: (imageName) => BuildStatus.completed.has(imageName),
      IsImageBuilding: (imageName) => BuildStatus.building.has(imageName),
      IsImageFailed: (imageName) => BuildStatus.failed.has(imageName),
      GetBuildStatus: () => ({
        pending: Array.from(BuildStatus.pending),
        building: Array.from(BuildStatus.building),
        completed: Array.from(BuildStatus.completed),
        failed: Array.from(BuildStatus.failed),
      }),
    };

    return {
      hooks: { startup: build_docker_images },
    };
  },
};

export default DockerPlugin;
