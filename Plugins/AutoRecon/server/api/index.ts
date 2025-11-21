import PenPal from "#penpal/core";
import { v4 as uuid } from "uuid";
import dns from "dns";
import { promisify } from "util";
import https from "https";
// Use console logging instead of the plugin logger to avoid require issues
const logger = {
  log: (...args: any[]) => console.log("[AutoRecon]", ...args),
  warn: (...args: any[]) => console.warn("[AutoRecon]", ...args),
  error: (...args: any[]) => console.error("[AutoRecon]", ...args),
};
import {
  AutoReconStatus,
  AutoReconStages,
} from "../../common/autorecon-constants.ts";

// Import tool functions
import { runFindomainScan } from "./tools/findomain.ts";
import { runCrtshScan } from "./tools/crtsh.ts";
import { runSubfinderScan } from "./tools/subfinder.ts";
import { runAmassScan } from "./tools/amass.ts";
import { runAssetfinderScan } from "./tools/assetfinder.ts";

// Note: Scan management is now handled by JobsTracker plugin
// We no longer need custom scan tracking

// Types
interface StagedAsset {
  id: string;
  project_id: string;
  type: string;
  value: string;
  tool: string;
  confidence: number;
  classification?: any;
  metadata?: any;
  created_at: string;
}

interface AutoReconConfiguration {
  _id?: string;
  project_id: string;
  tools: Record<string, boolean>;
  options: Record<string, boolean>;
  updated_at: string;
}

interface Job {
  id: string;
  name: string;
  plugin: string;
  progress?: number;
  statusText?: string;
  status: string;
  stages?: any[];
  created_at: string;
  updated_at: string;
  project_id: string;
  stdout?: string;
}

interface DomainResult {
  domain: string;
  ip?: string;
  resolved: boolean;
  error?: string;
  skip?: boolean;
}

interface ToolResult {
  tool: string;
  domain: string;
  result?: {
    domains?: string[];
    containerLogs?: {
      stdout: string;
      stderr: string;
    };
  };
}

interface AssetToStage {
  type: string;
  value: string;
  tool: string;
  confidence: number;
  metadata?: any;
  classification?: any;
}

// Deferred job creation helper for when DataStore isn't ready
const DeferJobCreateOrUpdate = async (jobsFunction: any, ...args: any[]): Promise<Job> => {
  logger.log(
    `DeferJobCreateOrUpdate: DataStore ready: ${
      PenPal.DataStore && PenPal.DataStore.AdaptersReady()
    }, Jobs available: ${!!PenPal.Jobs}`
  );

  // Try immediate job creation first
  if (PenPal.DataStore && PenPal.DataStore.AdaptersReady() && PenPal.Jobs) {
    logger.log("Creating job immediately - DataStore and Jobs are ready");
    try {
      const result = await jobsFunction(...args);
      logger.log(
        `Job created successfully: ${result?.id}, status: ${result?.status}`
      );
      return result;
    } catch (error) {
      logger.error("Immediate job creation failed:", error);
      // Fall back to deferred creation
      logger.log("Falling back to deferred job creation due to error");
    }
  }

  // Use deferred creation (either because conditions not met, or immediate creation failed)
  logger.log("Using deferred job creation");
  return new Promise((resolve) => {
    // Create a temporary job object to return immediately - include all the same properties as the real job
    const jobArgs = args[0] || {};
    const tempJob: Job = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: jobArgs.name || "AutoRecon Scan",
      plugin: "AutoRecon",
      progress: jobArgs.progress || 0,
      statusText: jobArgs.statusText || "Initializing scan...",
      status: jobArgs.status || "pending",
      project_id: jobArgs.project_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stages: jobArgs.stages || [], // Include the stages!
    };
    logger.log(
      `Returning temporary job with ${tempJob.stages.length} stages: ${tempJob.id}`
    );
    resolve(tempJob);

    // Queue the actual job creation for when DataStore is ready
    setTimeout(async () => {
      try {
        const realJob = await jobsFunction(...args);
        logger.log(`Deferred job created: ${realJob.id} (was ${tempJob.id})`);

        // Start the actual scan execution with the real job ID
        const domainsToScan = await getDomainsFromProjectScope(
          jobArgs.project_id
        );
        if (domainsToScan.length > 0) {
          executeAutoReconScan(realJob.id, domainsToScan);
        }
      } catch (error) {
        logger.error("Failed to create deferred job:", error);
      }
    }, 1000);
  });
};

// Staged Assets API
export const getStagedAssets = async (projectId: string): Promise<StagedAsset[]> => {
  try {
    const assets = await PenPal.DataStore.fetch(
      "AutoRecon",
      "AutoReconStagedAssets",
      {
        project_id: projectId,
      }
    );

    // Sort by creation date, most recent first
    return assets.sort(
      (a: StagedAsset, b: StagedAsset) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    logger.error("Failed to get staged assets:", error);
    throw error;
  }
};

export const getStagedAsset = async (assetId: string): Promise<StagedAsset | null> => {
  try {
    return await PenPal.DataStore.fetchOne(
      "AutoRecon",
      "AutoReconStagedAssets",
      {
        id: assetId,
      }
    );
  } catch (error) {
    logger.error("Failed to get staged asset:", error);
    throw error;
  }
};

export const createStagedAssets = async (projectId: string, assets: AssetToStage[]): Promise<any[]> => {
  try {
    const assetData = assets.map((asset) => ({
      id: uuid(),
      project_id: projectId,
      type: asset.type,
      value: asset.value,
      tool: asset.tool,
      confidence: asset.confidence || 50,
      classification: asset.classification || {},
      metadata: asset.metadata || {},
      created_at: new Date().toISOString(),
    }));

    const result = await PenPal.DataStore.insertMany(
      "AutoRecon",
      "AutoReconStagedAssets",
      assetData
    );
    logger.log(
      `Created ${result.length} staged assets for project ${projectId}`
    );

    return result;
  } catch (error) {
    logger.error("Failed to create staged assets:", error);
    throw error;
  }
};

export const deleteStagedAssets = async (assetIds: string[]): Promise<{ deleted: number }> => {
  try {
    let deletedCount = 0;
    for (const assetId of assetIds) {
      const result = await PenPal.DataStore.delete(
        "AutoRecon",
        "AutoReconStagedAssets",
        {
          id: assetId,
        }
      );
      if (result) deletedCount++;
    }

    logger.log(`Deleted ${deletedCount} staged assets`);
    return { deleted: deletedCount };
  } catch (error) {
    logger.error("Failed to delete staged assets:", error);
    throw error;
  }
};

// Configuration API
export const getAutoReconConfiguration = async (projectId: string): Promise<AutoReconConfiguration> => {
  try {
    // For global configuration, don't filter by project_id
    const query = projectId === "global" ? {} : { project_id: projectId };

    let configs = await PenPal.DataStore.fetch(
      "AutoRecon",
      "AutoReconConfigurations",
      query
    );

    let config = configs.length > 0 ? configs[0] : null;

    if (!config) {
      // Return default configuration
      config = {
        _id: "global",
        project_id: projectId,
        tools: {
          findomain: true,
          subfinder: true,
          amass: true,
          crtsh: true,
          assetfinder: true,
          nmap: true,
          httpx: true,
        },
        options: {
          recursive: false,
          scanAllDomains: false,
        },
        updated_at: new Date().toISOString(),
      };
    }

    return config;
  } catch (error) {
    logger.error("Failed to get AutoRecon configuration:", error);
    throw error;
  }
};

export const updateAutoReconConfiguration = async (
  projectId: string,
  tools?: Record<string, boolean>,
  options?: Record<string, boolean>
): Promise<AutoReconConfiguration> => {
  try {
    // For global configuration, don't filter by project_id
    const query = projectId === "global" ? {} : { project_id: projectId };

    const existingConfigs = await PenPal.DataStore.fetch(
      "AutoRecon",
      "AutoReconConfigurations",
      query
    );

    const existingConfig =
      existingConfigs.length > 0 ? existingConfigs[0] : null;

    const updatedConfig: AutoReconConfiguration = {
      _id: existingConfig?._id || "global",
      project_id: projectId,
      tools: tools || existingConfig?.tools || {},
      options: options || existingConfig?.options || {},
      updated_at: new Date().toISOString(),
    };

    if (existingConfig) {
      await PenPal.DataStore.updateOne(
        "AutoRecon",
        "AutoReconConfigurations",
        { _id: existingConfig._id },
        updatedConfig
      );
    } else {
      const result = await PenPal.DataStore.insertMany(
        "AutoRecon",
        "AutoReconConfigurations",
        [updatedConfig]
      );
      updatedConfig._id = result[0];
    }

    logger.log(`Updated AutoRecon configuration for project ${projectId}`);
    return updatedConfig;
  } catch (error) {
    logger.error("Failed to update AutoRecon configuration:", error);
    throw error;
  }
};

// Main AutoRecon execution logic
export const startAutoReconScan = async (projectId: string): Promise<Job> => {
  try {
    // Get domains to scan early to validate before creating job
    const domainsToScan = await getDomainsFromProjectScope(projectId);

    if (domainsToScan.length === 0) {
      throw new Error(
        "No domains found in project scope. Add some domains to scan."
      );
    }

    logger.log(
      `Starting AutoRecon scan for ${
        domainsToScan.length
      } domains: ${domainsToScan.join(", ")}`
    );

    logger.log("About to create job...");

    // Get configuration to determine which tools are enabled
    const config = await getAutoReconConfiguration(projectId);

    // Create dynamic stages based on enabled tools
    const toolStages = [];

    // Add stages for each enabled tool
    if (config.tools.findomain) {
      toolStages.push({
        name: "Findomain",
        status: "pending",
        progress: 0,
        statusText: "Waiting to start",
      });
    }
    if (config.tools.subfinder) {
      toolStages.push({
        name: "Subfinder",
        status: "pending",
        progress: 0,
        statusText: "Waiting to start",
      });
    }
    if (config.tools.amass) {
      toolStages.push({
        name: "Amass",
        status: "pending",
        progress: 0,
        statusText: "Waiting to start",
      });
    }
    if (config.tools.crtsh) {
      toolStages.push({
        name: "CRT.sh",
        status: "pending",
        progress: 0,
        statusText: "Waiting to start",
      });
    }
    if (config.tools.assetfinder) {
      toolStages.push({
        name: "Assetfinder",
        status: "pending",
        progress: 0,
        statusText: "Waiting to start",
      });
    }

    // Add results processing stage
    const stages = [
      ...toolStages,
      {
        name: "Results Processing",
        status: "pending",
        progress: 0,
        statusText: "Waiting for tools to complete",
      },
    ];

    // Use deferred job creation to handle cases where DataStore isn't ready
    const job = await DeferJobCreateOrUpdate(PenPal.Jobs.Create, {
      name: `AutoRecon Subdomain Discovery (${domainsToScan.length} domains)`,
      plugin: "AutoRecon",
      progress: 0,
      statusText: "Starting AutoRecon scan...",
      project_id: projectId,
      stages: stages,
    });

    // Debug: log what we're returning
    logger.log(`Returning job object:`, {
      id: job?.id,
      hasProjectId: !!job?.project_id,
      hasCreatedAt: !!job?.created_at,
      createdAtValue: job?.created_at,
      hasUpdatedAt: !!job?.updated_at,
      updatedAtValue: job?.updated_at,
    });

    // Start the scan execution only for real jobs
    // Temporary jobs will be executed when the real job is created
    if (!job.id.startsWith("temp-")) {
      // Start the scan in the background with a small delay
      setTimeout(() => {
        executeAutoReconScan(job.id, domainsToScan);
      }, 100);
    }

    return job;
  } catch (error) {
    logger.error("Failed to start AutoRecon scan:", error);
    throw error;
  }
};

// Asset acceptance/rejection
export const acceptStagedAssets = async (projectId: string, assetIds: string[]): Promise<{ accepted: number; rejected: number; errors: string[] }> => {
  try {
    const assets = await PenPal.DataStore.fetch(
      "AutoRecon",
      "AutoReconStagedAssets",
      {
        id: { $in: assetIds },
        project_id: projectId,
      }
    );

    let accepted = 0;
    let rejected = 0;
    const errors: string[] = [];

    for (const asset of assets) {
      try {
        if (asset.type === "domain") {
          // Create domain - DNS resolution and host creation now happen automatically in Domains.Insert()
          const { accepted: domainAccepted, rejected: domainRejected } =
            await PenPal.API.Domains.Insert({
              project: projectId,
              name: asset.value,
              //classification: asset.classification || {},
            });

          if (domainAccepted.length > 0) {
            const createdDomain = domainAccepted[0];
            logger.log(
              `Successfully added domain ${createdDomain.name} to project scope with automatic DNS resolution and host creation`
            );
          } else if (domainRejected.length > 0) {
            throw new Error(domainRejected[0].error.message);
          }
        } else if (asset.type === "host") {
          // Create host directly
          await PenPal.API.Hosts.Insert({
            project: projectId,
            ip_address: asset.value,
          });
        }
        // TODO: Handle service type assets

        accepted++;
      } catch (error: any) {
        errors.push(
          `Failed to accept ${asset.type} ${asset.value}: ${error.message}`
        );
        rejected++;
      }
    }

    // Remove accepted assets from staging
    if (accepted > 0) {
      await deleteStagedAssets(
        assetIds.filter((_, index) => {
          const asset = assets[index];
          return !errors.some((error) => error.includes(asset.value));
        })
      );
    }

    logger.log(
      `Accepted ${accepted} assets, rejected ${rejected} for project ${projectId}`
    );

    return { accepted, rejected, errors };
  } catch (error) {
    logger.error("Failed to accept staged assets:", error);
    throw error;
  }
};

export const rejectStagedAssets = async (projectId: string, assetIds: string[]): Promise<{ accepted: number; rejected: number; errors: string[] }> => {
  try {
    const result = await deleteStagedAssets(assetIds);
    logger.log(`Rejected ${result.deleted} assets for project ${projectId}`);

    return {
      accepted: 0,
      rejected: result.deleted,
      errors: [],
    };
  } catch (error) {
    logger.error("Failed to reject staged assets:", error);
    throw error;
  }
};

// Main execution logic
const executeAutoReconScan = async (jobId: string, domainsToScan: string[]): Promise<void> => {
  try {
    logger.log(`Starting AutoRecon scan ${jobId}`);

    const job = await PenPal.Jobs.Get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Update job status to running
    await PenPal.Jobs.UpdateStage(jobId, 0, {
      status: "running",
      statusText: "Running subdomain enumeration",
    });
    await PenPal.Jobs.Update(jobId, {
      statusText: "Starting subdomain enumeration",
    });

    // Get project information
    const project = await PenPal.API.Projects.Get(job.project_id);
    if (!project) {
      throw new Error(`Project ${job.project_id} not found`);
    }

    // Get configuration
    const config = await getAutoReconConfiguration(job.project_id);

    logger.log(
      `Found ${domainsToScan.length} domains to scan: ${domainsToScan.join(
        ", "
      )}`
    );

    // Execute the reconnaissance pipeline
    await runReconnaissancePipeline(jobId, domainsToScan, config);

    // Mark job as completed
    await PenPal.Jobs.Update(jobId, {
      progress: 100,
      status: "done",
      statusText: "AutoRecon scan completed successfully",
    });

    logger.log(`Completed AutoRecon scan ${jobId}`);
  } catch (error) {
    logger.error(`Failed to execute AutoRecon scan ${jobId}:`, error);
    await PenPal.Jobs.Update(jobId, {
      status: "failed",
      statusText: `Scan failed: ${(error as Error).message}`,
    });
  }
};

// Get domains from project scope (networks and hosts)
const getDomainsFromProjectScope = async (projectId: string): Promise<string[]> => {
  try {
    // Get domains directly from the new Domain API
    const domains = await PenPal.API.Domains.GetManyByProjectID(projectId);

    // Extract domain names from the Domain entities
    return domains.map((domain: any) => domain.name);
  } catch (error) {
    logger.error("Failed to get domains from project scope:", error);
    return [];
  }
};

// Helper function to update tool stage progress
const updateToolStageProgress = async (
  jobId: string,
  toolName: string,
  stageIndex: number,
  domain: string,
  result: any,
  toolCompletionCounts: Record<string, number>,
  toolDomainCounts: Record<string, number>,
  totalDomains: number
): Promise<void> => {
  const { domains: foundDomains } = result || {};

  toolCompletionCounts[toolName] = (toolCompletionCounts[toolName] || 0) + 1;
  toolDomainCounts[toolName] =
    (toolDomainCounts[toolName] || 0) + (foundDomains?.length || 0);

  const completedCount = toolCompletionCounts[toolName];
  const progress = Math.round((completedCount / totalDomains) * 100);

  logger.log(
    `Updating ${toolName} stage ${stageIndex}: completed ${completedCount}/${totalDomains} domains, progress ${progress}%`
  );

  try {
    await PenPal.Jobs.UpdateStage(jobId, stageIndex, {
      progress: Math.min(progress, 100),
      statusText: `Found ${foundDomains?.length || 0} subdomains for ${domain}`,
    });
    logger.log(
      `Successfully updated ${toolName} stage ${stageIndex} to ${progress}%`
    );
  } catch (stageError) {
    logger.error(
      `Failed to update ${toolName} stage ${stageIndex}:`,
      (stageError as Error).message
    );
  }

  // Mark stage as complete when all domains are done for this tool
  if (completedCount >= totalDomains) {
    logger.log(
      `Marking ${toolName} stage ${stageIndex} as completed with ${toolDomainCounts[toolName]} total subdomains`
    );

    try {
      await PenPal.Jobs.UpdateStage(jobId, stageIndex, {
        status: "done",
        progress: 100,
        statusText: `Completed: found ${toolDomainCounts[toolName]} subdomains`,
      });
      logger.log(`Successfully marked ${toolName} stage ${stageIndex} as done`);
    } catch (completeError) {
      logger.error(
        `Failed to mark ${toolName} stage ${stageIndex} as done:`,
        (completeError as Error).message
      );
    }
  }
};

// Main reconnaissance pipeline
const runReconnaissancePipeline = async (jobId: string, domains: string[], config: AutoReconConfiguration): Promise<void> => {
  const allDiscoveredDomains = new Set<string>();
  const discoveredHosts = new Set<string>();

  // Track completion counts per tool (used by updateToolStageProgress)
  const toolCompletionCounts: Record<string, number> = {};
  const toolDomainCounts: Record<string, number> = {};

  // Track which tools discovered each domain for confidence scoring
  const domainToolMap = new Map<string, Set<string>>(); // domain -> Set of tools that found it

  // Get current job to access stages
  const job = await PenPal.Jobs.Get(jobId);
  if (!job || !job.stages) {
    throw new Error(`Job ${jobId} not found or has no stages`);
  }

  // Create a map of tool names to stage indices based on the order we created them
  // The stages are created in this order: tools (in the order below), then results
  const enabledTools: string[] = [];
  if (config.tools.findomain) enabledTools.push("findomain");
  if (config.tools.subfinder) enabledTools.push("subfinder");
  if (config.tools.amass) enabledTools.push("amass");
  if (config.tools.crtsh) enabledTools.push("crtsh");
  if (config.tools.assetfinder) enabledTools.push("assetfinder");

  const toolStageMap: Record<string, number> = {};
  enabledTools.forEach((toolName, index) => {
    toolStageMap[toolName] = index;
  });
  const resultsStageIndex = enabledTools.length; // Results stage is after all tools

  logger.log(`Processing ${domains.length} domains: ${domains.join(", ")}`);
  logger.log(
    `Job has ${job.stages.length} stages, expecting ${enabledTools.length + 1}`
  );
  logger.log(`Enabled tools:`, enabledTools);
  logger.log(`Tool stage mapping:`, toolStageMap);
  logger.log(`Results stage index: ${resultsStageIndex}`);

  // Start all enabled tools and track their completion
  const toolPromises: Promise<ToolResult>[] = [];

  for (const domain of domains) {
    // Run all enabled tools in parallel for each domain
    if (config.tools.findomain) {
      logger.log(`Starting findomain scan for ${domain}`);
      try {
        await PenPal.Jobs.UpdateStage(jobId, toolStageMap.findomain, {
          status: "running",
          statusText: `Scanning ${domain}`,
        });
        logger.log(`Successfully set findomain stage to running`);
      } catch (error) {
        logger.error(
          `Failed to set findomain stage to running:`,
          (error as Error).message
        );
      }

      toolPromises.push(
        runFindomainScan(domain, jobId).then(async (result) => {
          // Update stage immediately when this tool completes for this domain
          await updateToolStageProgress(
            jobId,
            "findomain",
            toolStageMap.findomain,
            domain,
            result,
            toolCompletionCounts,
            toolDomainCounts,
            domains.length
          );
          return {
            tool: "findomain",
            domain,
            result,
          };
        })
      );
    }
    if (config.tools.subfinder) {
      logger.log(`Starting subfinder scan for ${domain}`);
      try {
        await PenPal.Jobs.UpdateStage(jobId, toolStageMap.subfinder, {
          status: "running",
          statusText: `Scanning ${domain}`,
        });
        logger.log(`Successfully set subfinder stage to running`);
      } catch (error) {
        logger.error(
          `Failed to set subfinder stage to running:`,
          (error as Error).message
        );
      }

      toolPromises.push(
        runSubfinderScan(domain, jobId).then(async (result) => {
          // Update stage immediately when this tool completes for this domain
          await updateToolStageProgress(
            jobId,
            "subfinder",
            toolStageMap.subfinder,
            domain,
            result,
            toolCompletionCounts,
            toolDomainCounts,
            domains.length
          );
          return {
            tool: "subfinder",
            domain,
            result,
          };
        })
      );
    }
    if (config.tools.amass) {
      logger.log(`Starting amass scan for ${domain}`);
      try {
        await PenPal.Jobs.UpdateStage(jobId, toolStageMap.amass, {
          status: "running",
          statusText: `Scanning ${domain}`,
        });
        logger.log(`Successfully set amass stage to running`);
      } catch (error) {
        logger.error(`Failed to set amass stage to running:`, (error as Error).message);
      }

      toolPromises.push(
        runAmassScan(domain, jobId).then(async (result) => {
          // Update stage immediately when this tool completes for this domain
          await updateToolStageProgress(
            jobId,
            "amass",
            toolStageMap.amass,
            domain,
            result,
            toolCompletionCounts,
            toolDomainCounts,
            domains.length
          );
          return {
            tool: "amass",
            domain,
            result,
          };
        })
      );
    }
    if (config.tools.crtsh) {
      logger.log(`Starting crt.sh scan for ${domain}`);
      try {
        await PenPal.Jobs.UpdateStage(jobId, toolStageMap.crtsh, {
          status: "running",
          statusText: `Scanning ${domain}`,
        });
        logger.log(`Successfully set crtsh stage to running`);
      } catch (error) {
        logger.error(`Failed to set crtsh stage to running:`, (error as Error).message);
      }

      toolPromises.push(
        (async () => {
          try {
            const crtshDomains = await runCrtshScan(domain);
            const result = {
              domains: crtshDomains,
              containerLogs: { stdout: "", stderr: "" },
            };
            // Update stage immediately when this tool completes for this domain
            await updateToolStageProgress(
              jobId,
              "crtsh",
              toolStageMap.crtsh,
              domain,
              result,
              toolCompletionCounts,
              toolDomainCounts,
              domains.length
            );
            return {
              tool: "crtsh",
              domain,
              result,
            };
          } catch (error) {
            logger.error(`crt.sh scan failed for ${domain}:`, error);
            const result = {
              domains: [],
              containerLogs: { stdout: "", stderr: (error as Error).message },
            };
            // Update stage even on failure
            await updateToolStageProgress(
              jobId,
              "crtsh",
              toolStageMap.crtsh,
              domain,
              result,
              toolCompletionCounts,
              toolDomainCounts,
              domains.length
            );
            return {
              tool: "crtsh",
              domain,
              result,
            };
          }
        })()
      );
    }
    if (config.tools.assetfinder) {
      logger.log(`Starting assetfinder scan for ${domain}`);
      try {
        await PenPal.Jobs.UpdateStage(jobId, toolStageMap.assetfinder, {
          status: "running",
          statusText: `Scanning ${domain}`,
        });
        logger.log(`Successfully set assetfinder stage to running`);
      } catch (error) {
        logger.error(
          `Failed to set assetfinder stage to running:`,
          (error as Error).message
        );
      }

      toolPromises.push(
        runAssetfinderScan(domain, jobId).then(async (result) => {
          // Update stage immediately when this tool completes for this domain
          await updateToolStageProgress(
            jobId,
            "assetfinder",
            toolStageMap.assetfinder,
            domain,
            result,
            toolCompletionCounts,
            toolDomainCounts,
            domains.length
          );
          return {
            tool: "assetfinder",
            domain,
            result,
          };
        })
      );
    }
  }

  logger.log(`Created ${toolPromises.length} tool scan promises`);

  // Wait for all tools to complete (stages are updated individually in promise chains)
  const toolResults = await Promise.allSettled(toolPromises);

  // Collect results and logs by tool (stages already updated individually)
  let allContainerLogs = "";
  let logCount = 0;

  for (const promiseResult of toolResults) {
    if (promiseResult.status === "fulfilled") {
      const { tool, domain, result } = promiseResult.value;
      const { domains: foundDomains, containerLogs } = result || {};

      // Add found domains to the set and track which tools found each domain
      if (foundDomains && Array.isArray(foundDomains)) {
        foundDomains.forEach((foundDomain) => {
          allDiscoveredDomains.add(foundDomain);

          // Track which tools discovered this domain
          if (!domainToolMap.has(foundDomain)) {
            domainToolMap.set(foundDomain, new Set());
          }
          domainToolMap.get(foundDomain)!.add(tool);
        });
      }

      // Collect container logs with tool-specific headers
      if (containerLogs) {
        const toolName = tool.charAt(0).toUpperCase() + tool.slice(1);
        if (containerLogs.stdout && containerLogs.stdout.trim()) {
          allContainerLogs += `\n=== ${toolName} Container Logs ===\n${containerLogs.stdout}\n`;
          logCount++;
        }
        if (containerLogs.stderr && containerLogs.stderr.trim()) {
          allContainerLogs += `\n=== ${toolName} Error Logs ===\n${containerLogs.stderr}\n`;
          logCount++;
        }
        if (
          (!containerLogs.stdout || !containerLogs.stdout.trim()) &&
          (!containerLogs.stderr || !containerLogs.stderr.trim())
        ) {
          allContainerLogs += `\n=== ${toolName} (${domain}) ===\n(No output captured)\n`;
          logCount++;
        }
      }
    } else {
      logger.error("Tool execution failed:", promiseResult.reason);
      allContainerLogs += `\n=== Tool Error ===\n${promiseResult.reason}\n`;
    }
  }

  // Attach accumulated logs to job
  if (allContainerLogs) {
    try {
      // First read existing stdout to append rather than overwrite
      const existingJob = await PenPal.Jobs.Get(jobId);
      const existingStdout = existingJob?.stdout || "";
      const combinedStdout = existingStdout + allContainerLogs;

      await PenPal.Jobs.Update(jobId, {
        stdout: combinedStdout,
      });
      logger.log(
        `Attached ${logCount} container log sections (${allContainerLogs.length} characters) to job ${jobId} (total stdout: ${combinedStdout.length})`
      );
    } catch (updateError) {
      logger.warn(
        `Failed to attach container logs to job ${jobId}:`,
        (updateError as Error).message
      );
    }
  }

  // Update overall job progress
  await PenPal.Jobs.Update(jobId, {
    progress: 75,
    statusText: `Found ${allDiscoveredDomains.size} unique subdomains`,
  });

  // Stage: Process and stage subdomain results
  await PenPal.Jobs.UpdateStage(jobId, resultsStageIndex, {
    status: "running",
    statusText: "Processing results",
  });

  // DNS Resolution and Classification Stage
  await PenPal.Jobs.UpdateStage(jobId, resultsStageIndex, {
    status: "running",
    statusText: "Resolving domains and classifying IPs",
  });

  // Process discovered domains: DNS resolution and classification
  await processAndClassifyDomains(
    jobId,
    Array.from(allDiscoveredDomains),
    domainToolMap,
    enabledTools.length
  );

  // Update final progress
  await PenPal.Jobs.Update(jobId, {
    progress: 100,
    statusText: "AutoRecon scan completed",
  });
  await PenPal.Jobs.UpdateStage(jobId, resultsStageIndex, {
    status: "done",
    progress: 100,
    statusText: "Domains resolved and classified",
  });
};

const stageDiscoveredAssets = async (
  jobId: string,
  domains: string[],
  domainToolMap: Map<string, Set<string>>,
  totalToolsEnabled: number
): Promise<void> => {
  const job = await PenPal.Jobs.Get(jobId);
  const projectId = job?.project_id;
  if (!projectId) {
    logger.error(`Could not get project ID for job ${jobId}`);
    return;
  }

  // Get existing domains in the project to avoid staging duplicates
  let existingDomains = new Set<string>();
  try {
    logger.log(`Fetching domains for project: ${projectId}`);
    const projectDomains = await PenPal.DataStore.fetch("CoreAPI", "Domains", {
      project: projectId,
    });
    logger.log(
      `Raw domain fetch result: ${projectDomains.length} domains found`
    );
    if (projectDomains.length > 0) {
      logger.log(`First domain sample:`, projectDomains[0]);
    }
    existingDomains = new Set(projectDomains.map((d: any) => d.name.toLowerCase()));
    logger.log(
      `Found ${existingDomains.size} existing domains in project ${projectId}:`,
      Array.from(existingDomains)
    );
  } catch (error) {
    logger.error(
      `Could not fetch existing domains for project ${projectId}:`,
      error
    );
    // Continue without filtering if we can't get existing domains
  }

  const assets: AssetToStage[] = [];
  logger.log(`Processing ${domains.length} discovered domains:`, domains);

  // Stage domains - filter out domains that are already in project scope
  // Calculate confidence based on how many tools discovered each domain
  for (const domain of domains) {
    // Skip domains that are already in the project scope (case-insensitive)
    if (existingDomains.has(domain.toLowerCase())) {
      logger.log(`Skipping domain ${domain} - already in project scope`);
      continue;
    }

    // Calculate confidence based on number of tools that found this domain
    const toolsThatFoundDomain = domainToolMap.get(domain) || new Set();
    const toolCount = toolsThatFoundDomain.size;
    const confidence = Math.round((toolCount / totalToolsEnabled) * 100);

    // logger.log(`Staging new domain ${domain} (found by ${toolCount}/${totalToolsEnabled} tools, confidence: ${confidence}%)`);
    assets.push({
      type: "domain",
      value: domain,
      tool: "autorecon", // Multiple tools may discover the same domain
      confidence: confidence,
      metadata: {
        jobId,
        toolsFoundBy: Array.from(toolsThatFoundDomain),
        toolCount: toolCount,
        totalToolsEnabled: totalToolsEnabled,
      },
    });
  }

  if (assets.length > 0) {
    await createStagedAssets(projectId, assets);
    logger.log(
      `Staged ${assets.length} new subdomain assets for project ${projectId} (${
        domains.length - assets.length
      } domains already in scope)`
    );
  } else {
    logger.log(
      `No new subdomain assets to stage for project ${projectId} - all ${domains.length} domains already in scope`
    );
  }
};

// DNS resolution and IP classification for discovered domains
const processAndClassifyDomains = async (
  jobId: string,
  domains: string[],
  domainToolMap: Map<string, Set<string>>,
  totalToolsEnabled: number
): Promise<void> => {
  logger.log("Starting DNS resolution process");
  const job = await PenPal.Jobs.Get(jobId);
  const projectId = job?.project_id;
  if (!projectId) {
    logger.error(`Could not get project ID for job ${jobId}`);
    return;
  }

  logger.log(
    `Processing ${domains.length} domains for DNS resolution and classification`
  );

  // Get existing hosts in the project to check for IP matches
  let existingHosts: any[] = [];
  try {
    const hosts = await PenPal.API.Hosts.GetManyByProjectID(projectId);
    existingHosts = hosts || [];
    logger.log(
      `Found ${existingHosts.length} existing hosts in project ${projectId}`
    );
  } catch (error) {
    logger.error(
      `Could not fetch existing hosts for project ${projectId}:`,
      error
    );
  }

  // Create IP to host mapping for quick lookup
  const ipToHostMap = new Map<string, any>();
  existingHosts.forEach((host) => {
    if (host.ip_address) {
      ipToHostMap.set(host.ip_address, host);
      logger.log(`Mapped host ${host.id} with IP ${host.ip_address}`);
    } else {
      logger.log(`Host ${host.id} has no IP address:`, host);
    }
  });
  logger.log(
    `IP to host mapping created with ${ipToHostMap.size} entries:`,
    Array.from(ipToHostMap.keys())
  );

  // Get existing domains to avoid duplicates
  let existingDomains = new Set<string>();
  try {
    const projectDomains = await PenPal.DataStore.fetch("CoreAPI", "Domains", {
      project: projectId,
    });
    existingDomains = new Set(projectDomains.map((d: any) => d.name.toLowerCase()));
    logger.log(
      `Found ${existingDomains.size} existing domains in project ${projectId}`
    );
  } catch (error) {
    logger.error(
      `Could not fetch existing domains for project ${projectId}:`,
      error
    );
  }

  // Use CoreAPI classification instead of local implementation

  const stagedAssets: AssetToStage[] = [];
  const autoAddedDomains: { domain: string; ip: string; hostId: string }[] = [];

  // Process domains in batches to avoid overwhelming DNS servers
  const batchSize = 10;
  for (let i = 0; i < domains.length; i += batchSize) {
    const batch = domains.slice(i, i + batchSize);
    logger.log(
      `Processing DNS batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        domains.length / batchSize
      )} (${batch.length} domains)`
    );

    // DNS resolution for this batch
    const dnsPromises: Promise<DomainResult>[] = batch.map(async (domain) => {
      try {
        // Skip if domain already exists
        if (existingDomains.has(domain.toLowerCase())) {
          logger.log(
            `Skipping domain ${domain} - already exists in project scope`
          );
          return { domain, skip: true } as DomainResult;
        }

        // Try DNS resolution using Node.js DNS as primary method
        try {
          // Use native Node.js DNS resolution as primary method
          const lookup = promisify(dns.lookup);
          const result = await lookup(domain, { family: 4 });
          logger.log(
            `Node.js DNS lookup successful for ${domain}: ${result.address}`
          );
          logger.log(
            `IP type: ${typeof result.address}, value: "${result.address}"`
          );
          return {
            domain,
            ip: result.address,
            resolved: true,
          };
        } catch (dnsError) {
          logger.log(
            `Node.js DNS failed for ${domain}, trying HTTP DNS API: ${(dnsError as Error).message}`
          );
          // Fallback to HTTP DNS API if Node.js DNS fails
          const url = `https://dns.google/resolve?name=${encodeURIComponent(
            domain
          )}&type=A`;

          const result = await new Promise<{ address: string }>((resolve, reject) => {
            https
              .get(
                url,
                {
                  headers: { Accept: "application/json" },
                  timeout: 5000,
                },
                (res) => {
                  let data = "";
                  res.on("data", (chunk) => (data += chunk));
                  res.on("end", () => {
                    try {
                      const json = JSON.parse(data);
                      if (json.Answer && json.Answer.length > 0) {
                        const ip = json.Answer[0].data;
                        logger.log(
                          `HTTP DNS API lookup successful for ${domain}: ${ip}`
                        );
                        resolve({ address: ip });
                      } else {
                        throw new Error("No DNS answer received");
                      }
                    } catch (e) {
                      reject(new Error(`DNS API parse error: ${(e as Error).message}`));
                    }
                  });
                }
              )
              .on("error", reject)
              .on("timeout", () => reject(new Error("DNS timeout")));
          });

          return {
            domain,
            ip: result.address,
            resolved: true,
          };
        }
      } catch (error) {
        logger.log(`DNS resolution failed for ${domain}:`, (error as Error).message);
        return {
          domain,
          resolved: false,
          error: (error as Error).message,
        };
      }
    });

    const dnsResults = await Promise.allSettled(dnsPromises);

    // Process DNS results
    const resolvedIPs: string[] = [];
    const domainResults: DomainResult[] = [];

    dnsResults.forEach((promiseResult) => {
      if (promiseResult.status === "fulfilled") {
        const result = promiseResult.value;
        if (result.skip) return;

        domainResults.push(result);
        if (result.resolved && result.ip) {
          resolvedIPs.push(result.ip);
        }
      }
    });

    // IP classification for resolved IPs using CoreAPI
    let ipClassifications: Record<string, any> = {};
    if (resolvedIPs.length > 0) {
      try {
        logger.log(
          `Classifying ${resolvedIPs.length} IPs (geolocation, ASN, cloud provider)`
        );
        ipClassifications = await PenPal.API.Classification.ClassifyIPs(
          resolvedIPs
        );
      } catch (error) {
        logger.error("IP classification failed:", error);
      }
    }

    // Process each domain result
    for (const result of domainResults) {
      const { domain, ip, resolved, error } = result;

      // Calculate confidence based on tools that found this domain
      const toolsThatFoundDomain = domainToolMap.get(domain) || new Set();
      const toolCount = toolsThatFoundDomain.size;
      const confidence = Math.round((toolCount / totalToolsEnabled) * 100);

      if (!resolved) {
        // DNS resolution failed - stage with error info
        logger.log(
          `Staging unresolved domain ${domain} (confidence: ${confidence}%)`
        );
        stagedAssets.push({
          type: "domain",
          value: domain,
          tool: "autorecon",
          confidence: confidence,
          classification: {
            dns_resolved: false,
            dns_error: error,
            tools_found_by: Array.from(toolsThatFoundDomain),
            tool_count: toolCount,
            total_tools_enabled: totalToolsEnabled,
          },
          metadata: {
            jobId,
            toolsFoundBy: Array.from(toolsThatFoundDomain),
            toolCount: toolCount,
            totalToolsEnabled: totalToolsEnabled,
          },
        });
        continue;
      }

      // Check if IP is already in project scope
      const existingHost = ipToHostMap.get(ip!);
      logger.log(
        `Checking if IP "${ip}" (type: ${typeof ip}) exists in scope. Found host:`,
        existingHost ? existingHost.id : "null"
      );
      logger.log(
        `Available IPs in scope: [${Array.from(ipToHostMap.keys())
          .map((ip) => `"${ip}"`)
          .join(", ")}]`
      );
      if (existingHost) {
        // IP exists - automatically add domain to scope and link to host
        logger.log(
          `Auto-adding domain ${domain} to scope (IP ${ip} already exists, linking to host ${existingHost.id})`
        );

        try {
          // Add domain to project scope
          const domainData = {
            name: domain,
            project: projectId,
            hosts: [existingHost.id], // Link to existing host
            discovered_by: "autorecon",
            confidence: confidence,
            metadata: {
              job_id: jobId,
              auto_added: true,
              linked_host: existingHost.id,
              tools_found_by: Array.from(toolsThatFoundDomain),
              tool_count: toolCount,
              total_tools_enabled: totalToolsEnabled,
            },
          };

          await PenPal.API.Domains.Insert(domainData);
          autoAddedDomains.push({ domain, ip: ip!, hostId: existingHost.id });
          logger.log(`Successfully added domain ${domain} to project scope`);
        } catch (error) {
          logger.error(`Failed to auto-add domain ${domain}:`, error);
          // Fall back to staging
          stagedAssets.push({
            type: "domain",
            value: domain,
            tool: "autorecon",
            confidence: confidence,
            classification: {
              dns_resolved: true,
              ip_address: ip,
              existing_host: existingHost.id,
              auto_add_failed: (error as Error).message,
              tools_found_by: Array.from(toolsThatFoundDomain),
              tool_count: toolCount,
              total_tools_enabled: totalToolsEnabled,
            },
            metadata: {
              jobId,
              resolved_ip: ip,
              toolsFoundBy: Array.from(toolsThatFoundDomain),
              toolCount: toolCount,
              totalToolsEnabled: totalToolsEnabled,
            },
          });
        }
      } else {
        // IP not in scope - classify and stage
        const classification = ipClassifications[ip!] || {};

        const fullClassification = {
          // Preserve all CoreAPI classification fields
          ...classification,
          // Add AutoRecon-specific fields
          dns_resolved: true,
          ip_address: ip,
          tools_found_by: Array.from(toolsThatFoundDomain),
          tool_count: toolCount,
          total_tools_enabled: totalToolsEnabled,
        };

        logger.log(
          `Staging domain ${domain} (${ip}) with classification: ${
            fullClassification.country || "Unknown"
          } / ${fullClassification.org || "Unknown ASN"} / ${
            fullClassification.cloud_provider?.provider || "Non-cloud"
          }${
            fullClassification.db_errors
              ? ` (DB issues: ${fullClassification.db_errors.join(", ")})`
              : ""
          }`
        );

        stagedAssets.push({
          type: "domain",
          value: domain,
          tool: "autorecon",
          confidence: confidence,
          classification: fullClassification,
          metadata: {
            jobId,
            resolved_ip: ip,
            toolsFoundBy: Array.from(toolsThatFoundDomain),
            toolCount: toolCount,
            totalToolsEnabled: totalToolsEnabled,
          },
        });
      }
    }

    // Small delay between batches to be respectful to DNS servers
    if (i + batchSize < domains.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Stage assets that need manual review
  if (stagedAssets.length > 0) {
    await createStagedAssets(projectId, stagedAssets);
    logger.log(`Staged ${stagedAssets.length} assets requiring manual review`);
  }

  // Log summary
  logger.log(`Domain processing complete:`);
  logger.log(`- Auto-added to scope: ${autoAddedDomains.length} domains`);
  logger.log(`- Staged for review: ${stagedAssets.length} assets`);

  if (autoAddedDomains.length > 0) {
    logger.log(
      "Auto-added domains:",
      autoAddedDomains.map((d) => `${d.domain} -> ${d.ip} (host ${d.hostId})`)
    );
  }
};
