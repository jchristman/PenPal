import PenPal from "#penpal/core";
import path from "path";
import util from "util";
import fs from "fs";
import pty from "node-pty";
import { v4 as uuid } from "uuid";
import { exec as _exec } from "child_process";
const exec = util.promisify(_exec);

const docker_host = "-H penpal-docker-api:2376";

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

  console.log(`[Docker] Waiting for image to build: ${imageName}`);
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

  console.log(`[Docker] Image ready: ${imageName}`);
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
    console.error(`[!] Job operation failed:`, {
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
      console.log(
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
      // Stage 2: Pulling images
      await safeJobOperation(PenPal.Jobs?.UpdateStage, job?.id, 1, {
        progress: 10,
        statusText: "Pulling images",
        status: "running",
      });

      await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
        progress: 40,
        statusText: "Pulling images",
      });

      console.log(`[.] Pulling images for compose file: ${args.name}`);
      res = await exec(
        `docker ${docker_host} compose -f ${args.docker_compose_path} pull`
      );

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

    console.log(`[.] Running compose file: ${args.name}`);
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

    console.log(`[+] Compose file now running: ${args.name}`);
  } catch (e) {
    // Update job with error status
    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 0,
      statusText: `Failed to run compose file: ${args.name} - ${e.message}`,
      status: "failed",
    });

    console.error(`[!] Failed to run compose file: ${args.name}`);

    // Pretty print the error instead of raw JSON
    if (e.cmd) {
      console.error(`[!] Command: ${e.cmd}`);
    }
    if (e.code !== undefined) {
      console.error(`[!] Exit code: ${e.code}`);
    }
    if (e.stderr) {
      console.error(`[!] Error output:`);
      console.error(e.stderr);
    }
    if (e.stdout) {
      console.error(`[!] Standard output:`);
      console.error(e.stdout);
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
    console.log(`[!!!] Skipping build with OFFLINE=true: ${args.name}`);
    return;
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

      console.log(`[+] Built image: ${args.name}`);
      return res;
    }
  } catch (e) {
    // Update job with error status
    await safeJobOperation(PenPal.Jobs?.Update, job?.id, {
      progress: 0,
      statusText: `Failed to build image: ${args.name} - ${e.message}`,
      status: "failed",
    });

    console.error(`[!] Failed to build image: ${args.name}`);

    // Pretty print the error with better formatting
    if (e.stderr) {
      console.error(`[!] Docker build stderr:`);
      console.error(e.stderr);
    }

    if (e.stdout) {
      console.error(`[!] Docker build stdout:`);
      console.error(e.stdout);
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
      console.error(`[!] Build error summary: ${errorSummary.trim()}`);
    }

    // Log full error details for debugging (but more readable)
    console.error(`[!] Full error details:`, {
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
