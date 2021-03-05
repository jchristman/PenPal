import PenPal from "meteor/penpal";

import _ from "lodash";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import util from "util";
import path from "path";
import fetch from "node-fetch";

import template_workflow_ts_file from "./templates/WorkflowTemplate.node.ts.js";
import template_trigger_ts_file from "./templates/TriggerTemplate.node.ts.js";

const N8N_DIR = "/n8n";
const N8N_NODES_DIR = "/home/node/custom-n8n-nodes/";

const killOldServer = async () => {
  console.log("[.] Killing old n8n server if still running");
  spawn(`ps -ef | grep "n8n" | awk '{print $2}' | xargs kill -9`, {
    stdio: "ignore",
    shell: true
  });
};

const cleanOldNodes = async () => {
  return new Promise((resolve) => {
    console.log("[.] Removing old custom n8n nodes");

    let processes = [
      spawn(`rm /home/node/.n8n/custom/*`, {
        stdio: ["ignore", "ignore", "ignore"],
        shell: true,
        cwd: N8N_DIR
      }),
      spawn(`for d in ./*/; do rm -rf $d; done`, {
        stdio: ["ignore", "ignore", "ignore"],
        shell: true,
        cwd: N8N_NODES_DIR
      })
    ];

    let finished_processes = 0;
    for (let process of processes) {
      process.on("close", (code) => {
        finished_processes += 1;
        if (finished_processes === processes.length) {
          console.log("[.] Finished removing old n8n nodes");
          resolve();
        }
      });
    }
  });
};

const generateNode = async (options, is_trigger_node) => {
  const output_dir = path.join(N8N_NODES_DIR, options.node.name);

  const output_ts_file = path.join(
    N8N_NODES_DIR,
    options.node.name,
    `${options.node.name}.node.ts`
  );

  const output_json_file = path.join(
    N8N_NODES_DIR,
    options.node.name,
    `${options.node.name}-settings.json`
  );

  try {
    await fs.mkdir(output_dir);
  } catch (e) {}

  console.log(`[.] Generating n8n node ${options.node.name}`);

  try {
    const template_file = is_trigger_node
      ? template_trigger_ts_file
      : template_workflow_ts_file;
    const data = template_file.replace(
      /NODE_NAME_REPLACE_ME/gi,
      options.node.name
    );
    await fs.writeFile(output_ts_file, data);
    await fs.writeFile(output_json_file, JSON.stringify(options, null, 4));
  } catch (e) {
    console.error(e);
  }
};

const generateNodes = async () => {
  for (let key in PenPal.LoadedPlugins) {
    const { settings: { n8n } = {} } = PenPal.LoadedPlugins[key];
    if (n8n === undefined) continue;

    const { workflow_nodes = [], trigger_nodes = [] } = n8n;

    for (let buildNode of workflow_nodes) {
      const node = buildNode();
      await generateNode(node, false);
    }

    for (let buildNode of trigger_nodes) {
      const node = buildNode();
      await generateNode(node, true);
    }
  }
};

const buildNodes = () => {
  return new Promise((resolve) => {
    console.log("[.] Building n8n nodes");

    let processes = [
      spawn(`n8n-node-dev build`, {
        stdio: ["ignore", "ignore", "inherit"],
        shell: true,
        cwd: N8N_NODES_DIR
      }),
      spawn(
        `for d in ./*/; do echo; echo "Building $d"; (cd $d && n8n-node-dev build) & done`,
        {
          stdio: ["ignore", "ignore", "inherit"],
          shell: true,
          cwd: N8N_NODES_DIR
        }
      )
    ];

    let finished_processes = 0;
    for (let process of processes) {
      process.on("close", (code) => {
        finished_processes += 1;
        if (finished_processes === processes.length) {
          console.log("[.] Finished building n8n nodes");
          resolve();
        }
      });
    }
  });
};

const startN8nServer = async () => {
  console.log("[.] Starting N8n server");
  spawn("npm run start", {
    stdio: "inherit",
    shell: true,
    cwd: N8N_DIR
  });
};

const createDefaultWorkflows = async () => {
  console.log("[.] Loading default workflows");
  const default_workflows = [];
  for (let key in PenPal.LoadedPlugins) {
    const workflows = PenPal.LoadedPlugins[key].settings?.n8n?.workflows;
    if (workflows?.length > 0) {
      default_workflows.push(...workflows);
    }
  }

  if (default_workflows.length === 0) {
    console.log("[.] Found no default workflows to create in n8n");
    return;
  }

  console.log(`[.] Found ${default_workflows.length} default workflows`);

  console.log("[.] Checking n8n for existing workflows...");

  let data = "";
  const max_attempts = 3;
  const attempt_delay = 3000;
  for (let attempt = 0; attempt < max_attempts; attempt += 1) {
    try {
      data = await (await fetch(`http://localhost:5678/rest/workflows`)).json();
      break;
    } catch (e) {
      if (attempt === max_attempts - 1) {
        console.error(
          `[!] Failed to fetch existing workflows within ${max_attempts} attempts. Bailing.`
        );
        return;
      }
      console.error(
        `[!] Failed to fetch existing workflows. Sleeping ${
          attempt_delay / 1000
        } seconds before trying again`
      );
      await PenPal.Utils.Sleep(attempt_delay);
    }
  }

  const existing_workflows = data?.data ?? [];
  const workflows_to_add = default_workflows.filter(
    (workflow) =>
      _.findIndex(
        existing_workflows,
        (existing_workflow) => existing_workflow.name === workflow.name
      ) === -1
  );

  console.log(`[.] Adding ${workflows_to_add.length} new default workflows`);

  for (let workflow of workflows_to_add) {
    try {
      const auto_activate = workflow.active === true;

      console.log(`[.] Creating default workflow "${workflow.name}"`);

      workflow.active = false;
      data = await (
        await fetch("http://localhost:5678/rest/workflows", {
          method: "post",
          body: JSON.stringify(workflow),
          headers: { "Content-Type": "application/json" }
        })
      ).json();

      const workflow_id = data?.data?.id;
      console.log(`[+] "${workflow.name}" created with ID ${data?.data?.id}`);

      if (auto_activate) {
        if (workflow_id === undefined) {
          console.error(`[!] Cannot activate "${workflow.name}" without an ID`);
          continue;
        }

        console.log(`[.] Activating workflow "${workflow.name}"`);

        workflow.active = true;
        data = await (
          await fetch(`http://localhost:5678/rest/workflows/${workflow_id}`, {
            method: "patch",
            body: JSON.stringify(workflow),
            headers: { "Content-Type": "application/json" }
          })
        ).json();

        if (data?.data?.active === true) {
          console.log(`[+] Activated worflow "${workflow.name}"`);
        }
      }
    } catch (e) {
      console.error(`[!] Failed to create workflow "${workflow.name}"`);
      console.error(e);
    }
  }
};

export default async () => {
  await PenPal.Utils.AsyncNOOP();
  console.log();
  killOldServer();
  await cleanOldNodes();
  await generateNodes();
  await buildNodes();
  startN8nServer();
  await PenPal.Utils.Sleep(5000);
  await createDefaultWorkflows();
};
