import PenPal from "#penpal/core";
import path from "path";
import util from "util";
import fs from "fs";
import crypto from "crypto";
import pty from "node-pty";
import { v4 as uuid } from "uuid";
import { exec as _exec } from "child_process";
import { spawnSync, spawn } from "child_process";
import { DockerLogger as logger } from "./plugin.js";
const exec = util.promisify(_exec);

const docker_host = "-H penpal-docker-api:2376";

// -----------------------------------------------------------------------
// Pull Tracking System

// Store pull timestamps to track when we last attempted pulls
const pullTrackingFile = "/penpal-plugin-share/docker-pull-tracking.json";

// -----------------------------------------------------------------------
// Build Tracking System

// Store build timestamps and context hashes to track when we last built with specific contexts
const buildTrackingFile = "/penpal-plugin-share/docker-build-tracking.json";

const loadBuildTracking = () => {
  try {
    if (fs.existsSync(buildTrackingFile)) {
      const data = fs.readFileSync(buildTrackingFile, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    logger.info(`Failed to load build tracking: ${error.message}`);
  }
  return {};
};

const saveBuildTracking = (tracking) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(buildTrackingFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(buildTrackingFile, JSON.stringify(tracking, null, 2));
  } catch (error) {
    logger.error(`Failed to save build tracking: ${error.message}`);
  }
};

const generateBuildContextHash = (args) => {
  const hash = crypto.createHash("sha256");

  try {
    // Hash the build arguments structure
    hash.update(
      JSON.stringify({
        name: args.name,
        dockercontext: args.dockercontext,
        dockerfile: args.dockerfile,
      })
    );

    // Hash Dockerfile content if it exists
    if (args.dockerfile && fs.existsSync(args.dockerfile)) {
      const dockerfileContent = fs.readFileSync(args.dockerfile, "utf8");
      hash.update(`dockerfile:${dockerfileContent}`);
    }

    // Hash docker context directory if it exists
    if (args.dockercontext && fs.existsSync(args.dockercontext)) {
      // Look for Dockerfile in the context directory
      const contextDockerfile = path.join(args.dockercontext, "Dockerfile");
      if (fs.existsSync(contextDockerfile)) {
        const dockerfileContent = fs.readFileSync(contextDockerfile, "utf8");
        hash.update(`context_dockerfile:${dockerfileContent}`);
      }

      // Also hash any package.json, requirements.txt, etc. for dependency changes
      const importantFiles = [
        "package.json",
        "requirements.txt",
        "go.mod",
        "Cargo.toml",
      ];
      for (const file of importantFiles) {
        const filePath = path.join(args.dockercontext, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf8");
          hash.update(`${file}:${content}`);
        }
      }
    }

    return hash.digest("hex");
  } catch (error) {
    logger.warn(`Failed to generate build context hash: ${error.message}`);
    // Fallback to a simple hash based on args
    hash.update(JSON.stringify(args));
    return hash.digest("hex");
  }
};

const recordBuildAttempt = (args) => {
  const tracking = loadBuildTracking();
  const contextHash = generateBuildContextHash(args);

  tracking[args.name] = {
    timestamp: new Date().toISOString(),
    contextHash: contextHash,
  };

  saveBuildTracking(tracking);
  // logger.info(
  //   `Recorded build attempt for ${
  //     args.name
  //   } with context hash ${contextHash.substring(0, 8)}...`
  // );
};

const getLastBuildAttempt = (args) => {
  const tracking = loadBuildTracking();
  const buildRecord = tracking[args.name];

  if (!buildRecord) {
    return null;
  }

  return {
    timestamp: new Date(buildRecord.timestamp),
    contextHash: buildRecord.contextHash,
  };
};

// Check if an image was built recently with the same context
const IsImageRecentlyBuilt = async (args) => {
  await PenPal.Utils.AsyncNOOP();

  // Generate current context hash
  const currentContextHash = generateBuildContextHash(args);

  // Check our build tracking
  const lastBuildAttempt = getLastBuildAttempt(args);
  if (lastBuildAttempt) {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check if build was recent AND context hasn't changed
    if (lastBuildAttempt.timestamp > twentyFourHoursAgo) {
      if (lastBuildAttempt.contextHash === currentContextHash) {
        const hoursAgo = Math.floor(
          (now - lastBuildAttempt.timestamp) / (1000 * 60 * 60)
        );
        const minutesAgo = Math.floor(
          (now - lastBuildAttempt.timestamp) / (1000 * 60)
        );

        let timeText;
        if (hoursAgo > 0) {
          timeText = `${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago`;
        } else {
          timeText = `${minutesAgo} minute${minutesAgo > 1 ? "s" : ""} ago`;
        }

        logger.info(
          `Image ${args.name} was built recently (${timeText}) with same context, skipping build`
        );
        return true;
      } else {
        logger.info(
          `Image ${
            args.name
          } was built recently but context changed (${lastBuildAttempt.contextHash.substring(
            0,
            8
          )}... -> ${currentContextHash.substring(0, 8)}...), rebuild needed`
        );
      }
    } else {
      const hoursAgo = Math.floor(
        (now - lastBuildAttempt.timestamp) / (1000 * 60 * 60)
      );
      logger.info(
        `Image ${args.name} last built ${hoursAgo} hours ago, rebuild needed`
      );
    }
  } else {
    logger.info(`No previous build record for ${args.name}, build needed`);
  }

  return false;
};

const loadPullTracking = () => {
  try {
    if (fs.existsSync(pullTrackingFile)) {
      const data = fs.readFileSync(pullTrackingFile, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    logger.info(`Failed to load pull tracking: ${error.message}`);
  }
  return {};
};

const savePullTracking = (tracking) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(pullTrackingFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(pullTrackingFile, JSON.stringify(tracking, null, 2));
  } catch (error) {
    logger.error(`Failed to save pull tracking: ${error.message}`);
  }
};

const recordPullAttempt = (image) => {
  const tracking = loadPullTracking();
  tracking[image] = new Date().toISOString();
  savePullTracking(tracking);
  logger.info(`Recorded pull attempt for ${image}`);
};

const getLastPullAttempt = (image) => {
  const tracking = loadPullTracking();
  return tracking[image] ? new Date(tracking[image]) : null;
};

// -----------------------------------------------------------------------
// Docker Image Readiness Helper

export const WaitForImageReady = async (imageName, options = {}) => {
  const {
    timeout = 120000, // 2 minutes default
    updateCallback = null,
    updateMessage = "Waiting for Docker image to build...",
  } = options;

  if (PenPal.Docker.IsImageReady(imageName)) {
    return true; // Already ready
  }

  if (PenPal.Docker.IsImageFailed(imageName)) {
    throw new Error(`Docker image build failed: ${imageName}`);
  }

  if (!PenPal.Docker.IsImageBuilding(imageName)) {
    throw new Error(`Docker image not available: ${imageName}`);
  }

  logger.info(`Waiting for image to build: ${imageName}`);
  if (updateCallback) {
    await updateCallback(25, updateMessage);
  }

  // Wait for build to complete (with timeout)
  const startTime = Date.now();
  while (!PenPal.Docker.IsImageReady(imageName)) {
    if (PenPal.Docker.IsImageFailed(imageName)) {
      throw new Error(`Docker image build failed: ${imageName}`);
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(`Docker image build timeout: ${imageName}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  logger.info(`Image ready: ${imageName}`);
  return true;
};

// -----------------------------------------------------------------------
// Safe Job Tracking Helpers

// Deferred job queue for operations that need to wait for DataStore
const DeferredJobs = {
  queue: [],
  timer: null,
};

// Process deferred jobs when DataStore becomes ready
const processDeferredJobs = async () => {
  if (
    PenPal.DataStore &&
    PenPal.DataStore.AdaptersReady() &&
    PenPal.Jobs !== undefined
  ) {
    // Test if Jobs store is actually accessible
    try {
      await PenPal.DataStore.fetchOne("JobsTracker", "Jobs", {
        id: "test-connectivity",
      });
      // Store is accessible, process queued jobs
      const jobs = [...DeferredJobs.queue];
      DeferredJobs.queue = [];

      for (const { operation, args, resolve, reject } of jobs) {
        try {
          const result = await operation(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }

      // Clear the timer since we processed all jobs
      if (DeferredJobs.timer) {
        clearInterval(DeferredJobs.timer);
        DeferredJobs.timer = null;
      }
    } catch (storeError) {
      // Store not ready yet, keep waiting
      if (
        !storeError.message?.includes("Cannot read properties of undefined")
      ) {
        // If it's not a "store not ready" error, process jobs anyway
        const jobs = [...DeferredJobs.queue];
        DeferredJobs.queue = [];

        for (const { operation, args, resolve, reject } of jobs) {
          try {
            const result = await operation(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      }
    }
  }
};

// Start the deferred jobs timer
const startDeferredJobsTimer = () => {
  if (!DeferredJobs.timer) {
    DeferredJobs.timer = setInterval(processDeferredJobs, 1000);
  }
};

// Function to safely create/update jobs when DataStore is ready
const safeJobOperation = async (operation, ...args) => {
  try {
    // For job update operations, check if job ID is valid
    if (
      operation === PenPal.Jobs?.Update ||
      operation === PenPal.Jobs?.UpdateStage
    ) {
      const jobId = args[0];
      if (!jobId || jobId === undefined) {
        // Job ID is invalid (likely because job creation was deferred), skip operation
        return null;
      }
    }

    if (
      PenPal.DataStore &&
      PenPal.DataStore.AdaptersReady() &&
      PenPal.Jobs !== undefined
    ) {
      // Test if Jobs store is accessible
      try {
        await PenPal.DataStore.fetchOne("JobsTracker", "Jobs", {
          id: "test-connectivity",
        });
        // Store is accessible, execute immediately
        return await operation(...args);
      } catch (storeError) {
        if (
          storeError.message?.includes("Cannot read properties of undefined")
        ) {
          if (args?.[0]?.stages?.length > 0) {
            // A deferred job with stages won't work, so just return null
            return null;
          }

          // Store not ready yet, defer the operation but don't block
          DeferredJobs.queue.push({
            operation,
            args,
            resolve: () => {},
            reject: () => {},
          });
          startDeferredJobsTimer();
          return null; // Return immediately, don't block
        } else {
          // Other error, try the operation anyway
          return await operation(...args);
        }
      }
    } else {
      if (args?.[0]?.stages?.length > 0) {
        // A deferred job with stages won't work, so just return null
        return null;
      }

      // DataStore not ready, defer the operation but don't block
      DeferredJobs.queue.push({
        operation,
        args,
        resolve: () => {},
        reject: () => {},
      });
      startDeferredJobsTimer();
      return null; // Return immediately, don't block
    }
  } catch (error) {
    logger.error(`Job operation failed:`, {
      message: error.message,
      name: error.name,
      stack: error.stack,
      error_object: error,
    });
    return null;
  }
};

const check_volume = async (volume) => {
  // check if volume is an object
  if (typeof volume !== "object") {
    logger.error(`Volume is not an object: ${volume}`);
    return false;
  }

  // check if volume has a name
  if (!volume.hasOwnProperty("name")) {
    logger.error(`Volume name is not set for ${volume}`);
    return false;
  }

  // check if volume has a path
  if (!volume.hasOwnProperty("path")) {
    logger.error(`Volume mount path is not set for ${volume.name}`);
    return false;
  }

  // check to see if the volume exists
  const output = await exec(
    `docker ${docker_host} volume inspect ${volume.name}`
  );
  if (output.stderr) {
    logger.error(`Volume ${volume.name} does not exist`);
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
    logger.error(`${args.docker_compose_path} does not exist`);
    return;
  }

  // Create a job to track the compose operation
  const job = await safeJobOperation(PenPal.Jobs?.Create, {
    name: `Docker Compose: ${args.name}`,
    plugin: "Docker",
    progress: 0,
    statusText: "Starting compose operation",
    status: "running",
    stages: [
      {
        name: "Preparing compose",
        plugin: "Docker",
        progress: 0,
        statusText: "Initializing",
        status: "pending",
        order: 1,
      },
      {
        name: "Pulling images",
        plugin: "Docker",
        progress: 0,
        statusText: "Waiting",
        status: "pending",
        order: 2,
      },
      {
        name: "Starting services",
        plugin: "Docker",
        progress: 0,
        statusText: "Waiting",
        status: "pending",
        order: 3,
      },
    ],
    metadata: {
      composeName: args.name,
      composePath: args.docker_compose_path,
    },
  });

  try {
    // Stage 1: Preparing compose
    await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 0, {
      progress: 100,
      statusText: "Compose file validated",
      status: "done",
    });

    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 20,
      statusText: "Compose file prepared",
    });
    let res;

    if (process.env.OFFLINE === "true") {
      logger.info(
        `[!!!] Skipping image pull with OFFLINE=true for ${args.name}`
      );

      // Stage 2: Skip pulling images in offline mode
      await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 1, {
        progress: 100,
        statusText: "Skipped (offline mode)",
        status: "done",
      });

      await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
        progress: 60,
        statusText: "Skipped image pull (offline mode)",
      });
    } else {
      // Stage 2: Check if images need pulling
      await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 1, {
        progress: 10,
        statusText: "Checking image freshness",
        status: "running",
      });

      const needsPull = await DoComposeImagesNeedPull(args.docker_compose_path);

      if (!needsPull) {
        // All images are recent, skip pull
        logger.info(
          `Skipping image pull for ${args.name} - all images are recent`
        );

        await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 1, {
          progress: 100,
          statusText: "Skipped (images are recent)",
          status: "done",
        });

        await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
          progress: 60,
          statusText: "Skipped image pull (images are recent)",
        });
      } else {
        // Some images need pulling
        await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 1, {
          progress: 30,
          statusText: "Pulling images",
          status: "running",
        });

        await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
          progress: 40,
          statusText: "Pulling images",
        });

        logger.info(`Pulling images for compose file: ${args.name}`);
        res = await exec(
          `docker ${docker_host} compose -f ${args.docker_compose_path} pull`
        );

        // Record pull attempts for all images in the compose file
        await recordComposePullAttempts(args.docker_compose_path);

        await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 1, {
          progress: 100,
          statusText: "Images pulled successfully",
          status: "done",
        });

        await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
          progress: 60,
          statusText: "Images pulled",
        });
      }
    }

    // Stage 3: Starting services
    await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 2, {
      progress: 10,
      statusText: "Starting services",
      status: "running",
    });

    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 80,
      statusText: "Starting services",
    });

    logger.info(`Running compose file: ${args.name}`);
    res = await exec(
      `docker ${docker_host} compose -f ${args.docker_compose_path} up -d --force-recreate`
    );

    // Complete the job
    await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 2, {
      progress: 100,
      statusText: "Services started successfully",
      status: "done",
    });

    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 100,
      statusText: `Compose file now running: ${args.name}`,
      status: "done",
    });

    logger.info(`Compose file now running: ${args.name}`);
  } catch (e) {
    // Update job with error status
    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 0,
      statusText: `Failed to run compose file: ${args.name} - ${e.message}`,
      status: "failed",
    });

    logger.error(`Failed to run compose file: ${args.name}`);

    // Pretty print the error instead of raw JSON
    if (e.cmd) {
      logger.error(`Command: ${e.cmd}`);
    }
    if (e.code !== undefined) {
      logger.error(`Exit code: ${e.code}`);
    }
    if (e.stderr) {
      logger.error(`Error output:`);
      logger.error(e.stderr);
    }
    if (e.stdout) {
      logger.error(`Standard output:`);
      logger.error(e.stdout);
    }
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
    logger.error(`Improper volume object: ${volume}`);
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

// Check if an image was pulled/created within the last 24 hours
export const IsImageRecentlyPulled = async (image) => {
  await PenPal.Utils.AsyncNOOP();

  // First check our pull tracking to see when we last attempted a pull
  const lastPullAttempt = getLastPullAttempt(image);
  if (lastPullAttempt) {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (lastPullAttempt > twentyFourHoursAgo) {
      const hoursAgo = Math.floor((now - lastPullAttempt) / (1000 * 60 * 60));
      const minutesAgo = Math.floor((now - lastPullAttempt) / (1000 * 60));

      let timeText;
      if (hoursAgo > 0) {
        timeText = `${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago`;
      } else {
        timeText = `${minutesAgo} minute${minutesAgo > 1 ? "s" : ""} ago`;
      }

      logger.info(
        `Image ${image} was pulled recently (${timeText}), skipping pull`
      );
      return true;
    } else {
      const hoursAgo = Math.floor((now - lastPullAttempt) / (1000 * 60 * 60));
      logger.info(
        `Image ${image} last pulled ${hoursAgo} hours ago, pull needed`
      );
    }
  }

  // Fallback to Docker's local timestamp if no pull tracking exists
  try {
    // Check if image exists locally first
    const listOutput = await exec(
      `docker ${docker_host} images ${image} --format "{{.Repository}}:{{.Tag}}\t{{.CreatedSince}}"`
    );

    if (!listOutput.stdout || listOutput.stdout.trim() === "") {
      logger.info(`Image ${image} not found locally, pull needed`);
      return false;
    }

    const lines = listOutput.stdout.trim().split("\n");
    if (lines.length === 0) {
      logger.info(`Image ${image} not found locally, pull needed`);
      return false;
    }

    // Parse the first matching image
    const [imageTag, createdSince] = lines[0].split("\t");

    // If no pull tracking exists, fall back to Docker's timestamp (less reliable)
    if (!lastPullAttempt) {
      // Check if CreatedSince indicates recent pull
      const hoursMatch = createdSince.match(/(\d+)\s+hours?\s+ago/);
      const minutesMatch = createdSince.match(/(\d+)\s+minutes?\s+ago/);
      const secondsMatch = createdSince.match(/(\d+)\s+seconds?\s+ago/);

      if (
        secondsMatch ||
        minutesMatch ||
        (hoursMatch && parseInt(hoursMatch[1]) < 24)
      ) {
        logger.info(
          `Image ${image} appears recent from Docker (${createdSince}), skipping pull`
        );
        return true;
      }
    }

    logger.info(`Image ${image} needs pull (Docker shows: ${createdSince})`);
    return false;
  } catch (error) {
    // Image doesn't exist locally or other error - need to pull
    logger.info(
      `Image ${image} not found locally or check failed, pull needed: ${error.message}`
    );
    return false;
  }
};

// Check if compose images need pulling (are any older than 24 hours)
export const DoComposeImagesNeedPull = async (docker_compose_path) => {
  await PenPal.Utils.AsyncNOOP();

  try {
    // Get list of images defined in compose file
    const configOutput = await exec(
      `docker ${docker_host} compose -f ${docker_compose_path} config --images`
    );

    if (!configOutput.stdout) {
      logger.info("No images found in compose file, pull needed");
      return true;
    }

    const images = configOutput.stdout
      .trim()
      .split("\n")
      .filter((img) => img.trim());

    if (images.length === 0) {
      logger.info("No images found in compose file, pull needed");
      return true;
    }

    // logger.info(
    //   `Checking ${images.length} images from compose file for recent pulls`
    // );

    // Check if any image needs pulling
    for (const image of images) {
      const needsPull = !(await IsImageRecentlyPulled(image.trim()));
      if (needsPull) {
        // logger.info(`At least one image (${image.trim()}) needs pulling`);
        return true;
      }
    }

    // logger.info("All compose images are recent, skipping pull");
    return false;
  } catch (error) {
    // If we can't check, err on the side of pulling
    logger.info(
      `Failed to check compose images, pull needed: ${error.message}`
    );
    return true;
  }
};

// Record pull attempts for all images in a compose file
const recordComposePullAttempts = async (docker_compose_path) => {
  try {
    // Get list of images defined in compose file
    const configOutput = await exec(
      `docker ${docker_host} compose -f ${docker_compose_path} config --images`
    );

    if (configOutput.stdout) {
      const images = configOutput.stdout
        .trim()
        .split("\n")
        .filter((img) => img.trim());

      for (const image of images) {
        recordPullAttempt(image.trim());
      }

      // logger.info(`Recorded pull attempts for ${images.length} compose images`);
    }
  } catch (error) {
    logger.error(`Failed to record compose pull attempts: ${error.message}`);
  }
};

export const Pull = async ({ image }) => {
  await PenPal.Utils.AsyncNOOP();

  // Check if image was pulled recently
  const isRecentlyPulled = await IsImageRecentlyPulled(image);
  if (isRecentlyPulled) {
    // logger.info(
    //   `Skipping pull for ${image} - image was pulled within last 24 hours`
    // );
    return { stdout: `Skipped: ${image} was pulled recently`, stderr: "" };
  }

  // Create a job to track the pull operation
  const job = await safeJobOperation(PenPal.Jobs?.Create, {
    name: `Pulling Docker Image: ${image}`,
    plugin: "Docker",
    progress: 0,
    statusText: "Starting image pull",
    status: "running",
    stages: [
      {
        name: "Pulling image",
        plugin: "Docker",
        progress: 0,
        statusText: "Initializing",
        status: "pending",
        order: 1,
      },
    ],
    metadata: {
      image: image,
    },
  });

  try {
    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 20,
      statusText: `Pulling image: ${image}`,
    });

    let output = await exec(`docker ${docker_host} pull ${image}`);

    // Record that we attempted a pull (successful)
    recordPullAttempt(image);

    // Complete the job
    await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 0, {
      progress: 100,
      statusText: "Image pulled successfully",
      status: "done",
    });

    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 100,
      statusText: `Successfully pulled image: ${image}`,
      status: "done",
    });

    return output;
  } catch (e) {
    // Update job with error status
    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 0,
      statusText: `Failed to pull image: ${image} - ${e.message}`,
      status: "failed",
    });

    throw e; // Re-throw the error for caller to handle
  }
};

export const Build = async (args) => {
  await PenPal.Utils.AsyncNOOP();

  if (process.env.OFFLINE === "true") {
    logger.info(`[!!!] Skipping build with OFFLINE=true: ${args.name}`);
    return;
  }

  // Check if image was built recently with the same context
  const isRecentlyBuilt = await IsImageRecentlyBuilt(args);
  if (isRecentlyBuilt) {
    logger.info(
      `Skipping build for ${args.name} - image was built recently with same context`
    );
    return {
      stdout: `Skipped: ${args.name} was built recently with same context`,
      stderr: "",
    };
  }

  // Create a job to track the build operation
  const job = await safeJobOperation(PenPal.Jobs?.Create, {
    name: `Building Docker Image: ${args.name}`,
    plugin: "Docker",
    progress: 0,
    statusText: "Starting docker build",
    status: "running",
    stages: [
      {
        name: "Preparing build context",
        plugin: "Docker",
        progress: 0,
        statusText: "Initializing",
        status: "pending",
        order: 1,
      },
      {
        name: "Executing docker build",
        plugin: "Docker",
        progress: 0,
        statusText: "Waiting",
        status: "pending",
        order: 2,
      },
      {
        name: "Finalizing",
        plugin: "Docker",
        progress: 0,
        statusText: "Waiting",
        status: "pending",
        order: 3,
      },
    ],
    metadata: {
      imageName: args.name,
      dockerContext: args.dockercontext,
      dockerfile: args.dockerfile,
    },
  });

  try {
    // Stage 1: Preparing build context
    await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 0, {
      progress: 50,
      statusText: "Preparing build context",
      status: "running",
    });

    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 10,
      statusText: "Preparing build context",
    });

    // Stage 2: Executing docker build
    await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 0, {
      progress: 100,
      statusText: "Build context prepared",
      status: "done",
    });

    await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 1, {
      progress: 10,
      statusText: "Starting docker build",
      status: "running",
    });

    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 30,
      statusText: "Executing docker build",
    });

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
      // Stage 3: Finalizing
      await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 1, {
        progress: 100,
        statusText: "Docker build completed",
        status: "done",
      });

      await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 2, {
        progress: 100,
        statusText: "Build finalized successfully",
        status: "done",
      });

      await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
        progress: 100,
        statusText: `Successfully built image: ${args.name}`,
        status: "done",
      });

      logger.info(`Built image: ${args.name}`);

      // Record that we successfully built this image with its context
      recordBuildAttempt(args);

      return res;
    }
  } catch (e) {
    // Update job with error status
    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 0,
      statusText: `Failed to build image: ${args.name} - ${e.message}`,
      status: "failed",
    });

    logger.error(`Failed to build image: ${args.name}`);

    // Pretty print the error with better formatting
    if (e.stderr) {
      logger.error(`Docker build stderr:`);
      logger.error(e.stderr);
    }

    if (e.stdout) {
      logger.error(`Docker build stdout:`);
      logger.error(e.stdout);
    }

    // Extract and display the most relevant error information
    const errorLines = e.message.split("\n");
    const errorSummary = errorLines.find(
      (line) =>
        line.includes("ERROR:") ||
        line.includes("failed to solve:") ||
        line.includes("DeadlineExceeded:")
    );

    if (errorSummary) {
      logger.error(`Build error summary: ${errorSummary.trim()}`);
    }

    // Log full error details for debugging (but more readable)
    logger.error(`Full error details:`, {
      message: e.message,
      code: e.code,
      signal: e.signal,
      cmd: e.cmd,
    });
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
