import PenPal from "#penpal/core";
import { TestRangeLogger } from "../plugin.js";
import util from "util";
import { exec as _exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const exec = util.promisify(_exec);
const docker_host = "-H penpal-docker-api:2376";

// Path to Vulhub repository (will be cloned if not exists)
const VULHUB_PATH = "/penpal-plugin-share/vulhub";

/**
 * Get all running containers managed by TestRange
 */
export const getRunningContainers = async () => {
  try {
    // Get all containers with label testrange=true
    const output = await exec(
      `docker ${docker_host} ps -a --filter "label=testrange=true" --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}"`
    );

    const containers = [];
    if (output.stdout && output.stdout.trim()) {
      const lines = output.stdout.trim().split("\n");
      for (const line of lines) {
        const [id, name, status, image] = line.split("|");
        if (id && name) {
          // Get IP address
          const ipInfo = await getContainerIP(id);
          // Get port mappings
          const portMappings = await getContainerPortMappings(id);
          containers.push({
            id: id.substring(0, 12), // Short ID
            fullId: id,
            name,
            status,
            image,
            ipAddress: ipInfo.ipAddress,
            network: ipInfo.network,
            portMappings,
          });
        }
      }
    }

    return containers;
  } catch (error) {
    TestRangeLogger.error("Error getting running containers:", error.message);
    return [];
  }
};

/**
 * Get detailed information about a container
 */
export const getContainerInfo = async (containerId) => {
  try {
    // Get container inspect data
    const inspectOutput = await exec(
      `docker ${docker_host} inspect ${containerId}`
    );
    const inspectData = JSON.parse(inspectOutput.stdout)[0];

    // Get IP address
    const ipInfo = await getContainerIP(containerId);
    // Get port mappings
    const portMappings = await getContainerPortMappings(containerId);

    return {
      id: containerId,
      name: inspectData.Name?.replace("/", "") || containerId,
      status: inspectData.State?.Status || "unknown",
      image: inspectData.Config?.Image || "unknown",
      ipAddress: ipInfo.ipAddress,
      network: ipInfo.network,
      created: inspectData.Created || new Date().toISOString(),
      labels: inspectData.Config?.Labels || {},
      ports: inspectData.NetworkSettings?.Ports || {},
      portMappings,
    };
  } catch (error) {
    TestRangeLogger.error("Error getting container info:", error.message);
    throw error;
  }
};

/**
 * Get container port mappings
 */
const getContainerPortMappings = async (containerId) => {
  try {
    const inspectOutput = await exec(
      `docker ${docker_host} inspect ${containerId} --format '{{json .NetworkSettings.Ports}}'`
    );
    const portsData = JSON.parse(inspectOutput.stdout);
    
    const portMappings = [];
    if (portsData) {
      for (const [containerPort, hostBindings] of Object.entries(portsData)) {
        if (hostBindings && hostBindings.length > 0) {
          for (const binding of hostBindings) {
            const [port, protocol] = containerPort.split("/");
            portMappings.push({
              hostPort: parseInt(binding.HostPort) || null,
              containerPort: parseInt(port) || null,
              protocol: protocol || "tcp",
            });
          }
        }
      }
    }
    
    return portMappings;
  } catch (error) {
    TestRangeLogger.warn("Error getting container port mappings:", error.message);
    return [];
  }
};

/**
 * Get container IP address from network
 */
const getContainerIP = async (containerId) => {
  try {
    const inspectOutput = await exec(
      `docker ${docker_host} inspect ${containerId} --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'`
    );
    const ipAddress = inspectOutput.stdout.trim();

    // Also get network name
    const networkOutput = await exec(
      `docker ${docker_host} inspect ${containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}'`
    );
    const network = networkOutput.stdout.trim();

    return {
      ipAddress: ipAddress || "N/A",
      network: network || "N/A",
    };
  } catch (error) {
    TestRangeLogger.warn("Error getting container IP:", error.message);
    return { ipAddress: "N/A", network: "N/A" };
  }
};

/**
 * Start a stopped container
 */
export const startContainer = async (containerId) => {
  try {
    await PenPal.Docker.Start(containerId);
    TestRangeLogger.log(`Started container: ${containerId}`);
    return { success: true };
  } catch (error) {
    TestRangeLogger.error("Error starting container:", error.message);
    throw error;
  }
};

/**
 * Stop a running container
 */
export const stopContainer = async (containerId) => {
  try {
    await PenPal.Docker.Stop(containerId);
    TestRangeLogger.log(`Stopped container: ${containerId}`);
    return { success: true };
  } catch (error) {
    TestRangeLogger.error("Error stopping container:", error.message);
    throw error;
  }
};

/**
 * Remove a container
 */
export const removeContainer = async (containerId) => {
  try {
    // Stop first if running
    try {
      await PenPal.Docker.Stop(containerId);
    } catch (e) {
      // Container might already be stopped
    }

    await PenPal.Docker.RemoveContainer(containerId);
    TestRangeLogger.log(`Removed container: ${containerId}`);

    // Note: We keep containers in RecentContainers even after removal
    // so users can quickly redeploy them

    return { success: true };
  } catch (error) {
    TestRangeLogger.error("Error removing container:", error.message);
    throw error;
  }
};

/**
 * Restart a container
 */
export const restartContainer = async (containerId) => {
  try {
    await stopContainer(containerId);
    await PenPal.Utils.Sleep(1000); // Brief pause
    await startContainer(containerId);
    TestRangeLogger.log(`Restarted container: ${containerId}`);
    return { success: true };
  } catch (error) {
    TestRangeLogger.error("Error restarting container:", error.message);
    throw error;
  }
};

/**
 * Get available Vulhub containers
 * Scans the Vulhub repository for available docker-compose files
 */
export const getAvailableContainers = async () => {
  try {
    // Ensure Vulhub is cloned
    await ensureVulhubCloned();

    const containers = [];
    const vulhubDir = VULHUB_PATH;

    // Walk through directories looking for docker-compose.yml files
    const walkDir = (dir, basePath = "") => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = basePath
          ? `${basePath}/${entry.name}`
          : entry.name;

        if (entry.isDirectory()) {
          // Skip hidden directories and common non-container dirs
          if (
            entry.name.startsWith(".") ||
            entry.name === "node_modules" ||
            entry.name === ".git"
          ) {
            continue;
          }
          walkDir(fullPath, relativePath);
        } else if (entry.name === "docker-compose.yml") {
          // Found a docker-compose file
          const dirPath = path.dirname(fullPath);
          const dirName = path.basename(dirPath);
          const parentDir = path.basename(path.dirname(dirPath));

          // Extract CVE or vulnerability name from path
          const parts = relativePath.split("/");
          const category = parts[0] || "unknown";
          const name = parts[1] || dirName;

          containers.push({
            id: `${category}/${name}`,
            category,
            name,
            path: dirPath,
            relativePath: path.dirname(relativePath),
            dockerComposePath: fullPath,
          });
        }
      }
    };

    walkDir(vulhubDir);

    // Sort by category and name
    containers.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return containers;
  } catch (error) {
    TestRangeLogger.error("Error getting available containers:", error.message);
    return [];
  }
};

/**
 * Ensure Vulhub repository is cloned
 */
const ensureVulhubCloned = async () => {
  if (!fs.existsSync(VULHUB_PATH)) {
    TestRangeLogger.log("Cloning Vulhub repository...");
    try {
      await exec(
        `git clone --depth 1 https://github.com/vulhub/vulhub.git ${VULHUB_PATH}`
      );
      TestRangeLogger.log("Vulhub repository cloned successfully");
    } catch (error) {
      TestRangeLogger.error("Error cloning Vulhub:", error.message);
      throw new Error(`Failed to clone Vulhub: ${error.message}`);
    }
  }
};

/**
 * Deploy a Vulhub container
 */
export const deployVulhubContainer = async (containerPath, containerName) => {
  try {
    // Ensure Vulhub is cloned
    await ensureVulhubCloned();

    const dockerComposePath = path.join(VULHUB_PATH, containerPath, "docker-compose.yml");

    if (!fs.existsSync(dockerComposePath)) {
      throw new Error(`Docker compose file not found: ${dockerComposePath}`);
    }

    // Read the original compose file
    const composeContent = fs.readFileSync(dockerComposePath, "utf8");

    // Parse YAML manually with a more careful approach
    // First, let's read the file and parse it line by line to understand structure
    const lines = composeContent.split("\n");
    const modifiedLines = [];
    let inServices = false;
    let currentServiceIndent = 0;
    let currentService = null;
    let serviceHasLabels = false;
    let serviceHasNetworks = false;
    let serviceHasPorts = false;
    let inPortsSection = false;
    let portsSectionIndent = 0;
    let networksSectionExists = false;
    let networksSectionLine = -1;
    const servicePortMappings = new Map(); // Track port mappings per service

    // Helper to generate random high port (40000-50000 range)
    const getRandomHighPort = () => {
      return Math.floor(Math.random() * 10000) + 40000;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const indent = line.length - line.trimStart().length;

      // Detect services section
      if (trimmed === "services:" || trimmed.startsWith("services:")) {
        inServices = true;
        modifiedLines.push(line);
        continue;
      }

      // Detect end of services section (next top-level key)
      if (inServices && indent === 0 && trimmed && !trimmed.startsWith("#") && trimmed !== "services:") {
        // We're leaving services section
        if (currentService && !serviceHasLabels) {
          // Add labels before leaving service
          const labelsIndent = " ".repeat(currentServiceIndent + 2);
          modifiedLines.push(`${labelsIndent}labels:`);
          modifiedLines.push(`${labelsIndent}  - "testrange=true"`);
        }
        if (currentService && !serviceHasNetworks) {
          // Add networks before leaving service
          const networksIndent = " ".repeat(currentServiceIndent + 2);
          modifiedLines.push(`${networksIndent}networks:`);
          modifiedLines.push(`${networksIndent}  - penpal_penpal`);
        }
        // Add port mappings if service had ports but we removed them
        if (currentService && serviceHasPorts && servicePortMappings.has(currentService)) {
          const portsIndent = " ".repeat(currentServiceIndent + 2);
          modifiedLines.push(`${portsIndent}ports:`);
          const mappings = servicePortMappings.get(currentService);
          for (const mapping of mappings) {
            modifiedLines.push(`${portsIndent}  - "${mapping.hostPort}:${mapping.containerPort}"`);
          }
        }
        inServices = false;
        currentService = null;
        serviceHasLabels = false;
        serviceHasNetworks = false;
        serviceHasPorts = false;
        inPortsSection = false;
      }

      // Detect networks section
      if (trimmed === "networks:" || trimmed.startsWith("networks:")) {
        networksSectionExists = true;
        networksSectionLine = modifiedLines.length;
      }

      // In services section - detect service definitions
      if (inServices && indent === 2 && trimmed && !trimmed.startsWith("#") && trimmed.endsWith(":")) {
        // New service detected
        if (currentService && !serviceHasLabels) {
          // Add labels to previous service
          const labelsIndent = " ".repeat(currentServiceIndent + 2);
          modifiedLines.push(`${labelsIndent}labels:`);
          modifiedLines.push(`${labelsIndent}  - "testrange=true"`);
        }
        if (currentService && !serviceHasNetworks) {
          // Add networks to previous service
          const networksIndent = " ".repeat(currentServiceIndent + 2);
          modifiedLines.push(`${networksIndent}networks:`);
          modifiedLines.push(`${networksIndent}  - penpal_penpal`);
        }
        // Add port mappings to previous service if needed
        if (currentService && serviceHasPorts && servicePortMappings.has(currentService)) {
          const portsIndent = " ".repeat(currentServiceIndent + 2);
          modifiedLines.push(`${portsIndent}ports:`);
          const mappings = servicePortMappings.get(currentService);
          for (const mapping of mappings) {
            modifiedLines.push(`${portsIndent}  - "${mapping.hostPort}:${mapping.containerPort}"`);
          }
        }
        // Start new service
        currentService = trimmed.slice(0, -1).trim();
        currentServiceIndent = indent;
        serviceHasLabels = false;
        serviceHasNetworks = false;
        serviceHasPorts = false;
        inPortsSection = false;
        modifiedLines.push(line);
        continue;
      }

      // Handle port mappings - override to random high ports
      if (inServices && currentService && indent > currentServiceIndent) {
        if (trimmed.startsWith("ports:")) {
          serviceHasPorts = true;
          inPortsSection = true;
          portsSectionIndent = indent;
          // Skip the ports: line - we'll add our own mappings later
          continue;
        }
        
        // Inside ports section - parse and override port mappings
        if (inPortsSection && indent > portsSectionIndent) {
          // Check if this is still part of ports section
          if (indent <= currentServiceIndent) {
            // We've left the ports section
            inPortsSection = false;
          } else {
            // Parse port mapping - handle various formats:
            // "3000:3000", "3000:3000/tcp", "0.0.0.0:3000:3000", "- 3000:3000"
            const portMatch = line.match(/(?:["']?)(?:(?:\d+\.\d+\.\d+\.\d+):)?(\d+):(\d+)(?:\/(\w+))?(?:["']?)/);
            if (portMatch) {
              const containerPort = portMatch[2];
              const protocol = portMatch[3] || "tcp";
              const hostPort = getRandomHighPort();
              
              // Store mapping for this service
              if (!servicePortMappings.has(currentService)) {
                servicePortMappings.set(currentService, []);
              }
              servicePortMappings.get(currentService).push({
                hostPort,
                containerPort: parseInt(containerPort),
                protocol,
              });
              
              // Skip original port mapping line - we'll add our own later
              continue;
            } else if (trimmed.startsWith("-")) {
              // Port mapping list item - try to parse the value after the dash
              const valueMatch = trimmed.match(/-?\s*["']?(?:(?:\d+\.\d+\.\d+\.\d+):)?(\d+):(\d+)(?:\/(\w+))?(?:["']?)/);
              if (valueMatch) {
                const containerPort = valueMatch[2];
                const protocol = valueMatch[3] || "tcp";
                const hostPort = getRandomHighPort();
                
                if (!servicePortMappings.has(currentService)) {
                  servicePortMappings.set(currentService, []);
                }
                servicePortMappings.get(currentService).push({
                  hostPort,
                  containerPort: parseInt(containerPort),
                  protocol,
                });
              }
              // Skip original port mapping line
              continue;
            }
          }
        }
        
        // Check if we're leaving ports section
        if (inPortsSection && indent <= portsSectionIndent) {
          inPortsSection = false;
        }
      }

      // Check for labels in current service
      if (inServices && currentService && indent > currentServiceIndent) {
        if (trimmed.startsWith("labels:")) {
          serviceHasLabels = true;
          // Check if testrange label already exists
          let hasTestrangeLabel = false;
          let j = i + 1;
          while (j < lines.length && lines[j].trimStart().length > indent) {
            if (lines[j].includes("testrange=true")) {
              hasTestrangeLabel = true;
              break;
            }
            j++;
          }
          if (!hasTestrangeLabel) {
            modifiedLines.push(line);
            // Add testrange label
            const labelIndent = " ".repeat(indent + 2);
            modifiedLines.push(`${labelIndent}- "testrange=true"`);
            continue;
          }
        }
        if (trimmed.startsWith("networks:")) {
          serviceHasNetworks = true;
          // Check if penpal_penpal network already exists
          let hasPenpalNetwork = false;
          let j = i + 1;
          while (j < lines.length && lines[j].trimStart().length > indent) {
            if (lines[j].includes("penpal_penpal")) {
              hasPenpalNetwork = true;
              break;
            }
            j++;
          }
          if (!hasPenpalNetwork) {
            modifiedLines.push(line);
            // Add penpal_penpal network
            const networkIndent = " ".repeat(indent + 2);
            modifiedLines.push(`${networkIndent}- penpal_penpal`);
            continue;
          }
        }
      }

      modifiedLines.push(line);
    }

    // Add labels/networks/ports to last service if needed
    if (currentService && !serviceHasLabels) {
      const labelsIndent = " ".repeat(currentServiceIndent + 2);
      modifiedLines.push(`${labelsIndent}labels:`);
      modifiedLines.push(`${labelsIndent}  - "testrange=true"`);
    }
    if (currentService && !serviceHasNetworks) {
      const networksIndent = " ".repeat(currentServiceIndent + 2);
      modifiedLines.push(`${networksIndent}networks:`);
      modifiedLines.push(`${networksIndent}  - penpal_penpal`);
    }
    // Add port mappings to last service if it had ports
    if (currentService && serviceHasPorts && servicePortMappings.has(currentService)) {
      const portsIndent = " ".repeat(currentServiceIndent + 2);
      modifiedLines.push(`${portsIndent}ports:`);
      const mappings = servicePortMappings.get(currentService);
      for (const mapping of mappings) {
        modifiedLines.push(`${portsIndent}  - "${mapping.hostPort}:${mapping.containerPort}"`);
      }
    }

    // Add networks section if it doesn't exist
    if (!networksSectionExists) {
      modifiedLines.push("");
      modifiedLines.push("networks:");
      modifiedLines.push("  penpal_penpal:");
      modifiedLines.push("    external: true");
    } else {
      // Insert penpal_penpal network definition after networks: line
      const insertIndex = networksSectionLine + 1;
      // Check if penpal_penpal already defined
      let hasPenpalNetwork = false;
      for (let i = insertIndex; i < modifiedLines.length; i++) {
        if (modifiedLines[i].includes("penpal_penpal:")) {
          hasPenpalNetwork = true;
          break;
        }
        if (modifiedLines[i].trim() && !modifiedLines[i].startsWith(" ") && !modifiedLines[i].startsWith("#")) {
          break; // Next top-level key
        }
      }
      if (!hasPenpalNetwork) {
        modifiedLines.splice(insertIndex, 0, "  penpal_penpal:", "    external: true");
      }
    }

    // Write modified compose file to temp location
    const tempComposePath = `/penpal-plugin-share/testrange/${containerName}-docker-compose.yml`;
    PenPal.Utils.MkdirP(path.dirname(tempComposePath));
    fs.writeFileSync(tempComposePath, modifiedLines.join("\n"));

    // Deploy using Docker Compose
    const result = await PenPal.Docker.Compose({
      name: `testrange-${containerName}`,
      docker_compose_path: tempComposePath,
    });

    // Wait a bit for containers to start
    await PenPal.Utils.Sleep(2000);

    // Record in recent containers with port mappings
    const containerInfo = await getRunningContainers();
    const deployedContainers = containerInfo.filter((c) =>
      c.name.includes(containerName) || c.name.includes("testrange")
    );

    for (const container of deployedContainers) {
      await recordRecentContainer({
        containerId: container.fullId,
        containerName: container.name,
        image: container.image,
        vulhubPath: containerPath,
        deployedAt: new Date().toISOString(),
        portMappings: container.portMappings || [],
      });
    }

    return {
      success: true,
      containers: deployedContainers,
      portMappings: Array.from(servicePortMappings.entries()).reduce((acc, [service, mappings]) => {
        acc[service] = mappings;
        return acc;
      }, {}),
    };
  } catch (error) {
    TestRangeLogger.error("Error deploying container:", error.message);
    throw error;
  }
};

/**
 * Record a container in recent containers
 */
const recordRecentContainer = async (containerData) => {
  try {
    // Normalize container name by removing testrange prefix and instance numbers for matching
    // Docker names like "testrange-CVE-2025-29927-web-1" become "CVE-2025-29927-web"
    const normalizedName = containerData.containerName
      .replace(/^testrange-/, "")
      .replace(/-\d+$/, ""); // Remove trailing instance number
    
    // Match by vulhubPath and normalized containerName (not containerId) so redeployments update the same record
    // First, get all recent containers for this vulhubPath
    const allRecent = await PenPal.DataStore.fetch(
      "TestRange",
      "RecentContainers",
      { vulhubPath: containerData.vulhubPath }
    );
    
    // Find matching container by normalized name
    const existing = (allRecent || []).find(rec => {
      const recNormalized = rec.containerName
        .replace(/^testrange-/, "")
        .replace(/-\d+$/, "");
      return recNormalized === normalizedName;
    });

    if (existing) {
      // Update existing record with new containerId and port mappings
      await PenPal.DataStore.updateOne(
        "TestRange",
        "RecentContainers",
        { id: existing.id },
        {
          containerId: containerData.containerId,
          containerName: containerData.containerName, // Update with new full name
          image: containerData.image,
          portMappings: containerData.portMappings || [],
          deployedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );
    } else {
      // Insert new
      await PenPal.DataStore.insertMany("TestRange", "RecentContainers", [
        {
          id: uuid(),
          ...containerData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }
  } catch (error) {
    TestRangeLogger.warn("Error recording recent container:", error.message);
  }
};

/**
 * Get recent containers
 */
export const getRecentContainers = async (limit = 50) => {
  try {
    const recent = await PenPal.DataStore.fetch(
      "TestRange",
      "RecentContainers",
      {}
    );

    // Sort by most recently deployed first (deployedAt takes precedence over created_at)
    const sorted = (recent || []).sort((a, b) => {
      const dateA = new Date(a.deployedAt || a.created_at || 0);
      const dateB = new Date(b.deployedAt || b.created_at || 0);
      return dateB - dateA;
    });

    return sorted.slice(0, limit);
  } catch (error) {
    TestRangeLogger.error("Error getting recent containers:", error.message);
    return [];
  }
};

