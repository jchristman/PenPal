# PenPal

PenPal is an automation and reporting all-in-one tool that is meant to enable Cybersecurity Engineers to perform a better, more thorough job and produce better quality reports by automating many of the most tedious tasks in penetration testing and/or red teaming. It is built on a pluggable architecture that can allow for many tools to be integrated seamlessly into the structured, opinionated database scheme. This allows for a consistent approach to targeting that can enable trigger-based automations to perform actions when a condition occurs or on-demand.

## Features

- [ ] Core API for data standardization (Plugin)
  - [x] Customers (can have many projects)
  - [x] Projects
  - [x] Hosts
  - [x] Networks (have many hosts)
  - [x] Services (ports, etc)
  - [ ] Vulnerabilities
  - [ ] Credentials
  - [ ] Files
  - [ ] Notes
  - [ ] Audit trails
- [x] Centralized Job Management System
  - [x] Real-time job tracking and monitoring via WebSocket subscriptions
  - [x] Multi-stage job support with progress tracking
  - [x] Automatic job cleanup and status management
  - [x] Web UI for job visualization and filtering
  - [x] Plugin integration via Jobs API
  - [x] Live navbar job counter with spinning icon for active jobs
- [ ] User Interface
  - [ ] Pluggable Dashboard
  - [x] Projects Summary Page
  - [x] Jobs Monitoring Page with real-time WebSocket updates
  - [x] Live job counter in navigation bar
  - [ ] Project Details Page
  - [ ] Notetaking
  - [ ] .... other things and stuff
- [x] DataStore abstraction layer
- [ ] DataStore Adapters
  - [x] Mongo Adapter
  - [ ] Postgres Adapter (Plugin)
  - [ ] Grepable Filesystem Adapter (Plugin)
  - [x] S3 Adapter
    - [x] [MinIO](https://min.io) (Plugin)
    - [ ] Amazon S3 (Plugin)
- [x] Docker support for plugins
- [ ] Report generation
  - [ ] [Ghostwriter](https://github.com/GhostManager/Ghostwriter) (Plugin)

## Service Enrichment System

PenPal features an **extensible service enrichment architecture** that allows plugins to add rich metadata to discovered services. This creates a comprehensive intelligence view by layering data from multiple cybersecurity tools.

### How It Works

1. **Service Discovery**: Tools like Nmap discover services (IP:port combinations)
2. **Enrichment Plugins**: Additional tools (HttpX, etc.) analyze services and add metadata
3. **Unified View**: All enrichment data is displayed in a rich, extensible UI
4. **Plugin Extensibility**: New plugins can register custom display components

### Current Enrichment Plugins

- **[Nmap](https://nmap.org/)**: Service fingerprinting, version detection, OS detection
  - Service names, product versions, banners
  - Operating system detection
  - Service fingerprints and additional info
- **[HttpX](https://github.com/projectdiscovery/httpx)**: HTTP service analysis
  - HTTP status codes, content types, page titles
  - Technology stack detection (frameworks, servers, etc.)
  - Content length, response headers
  - Clickable URLs with security validation

### Enrichment UI Features

**Services Tab Structure:**

- **List View**: Overview of all services with enrichment count badges
- **Enrichments View**: Detailed plugin data with custom rich displays
- **Graph View**: Network topology visualization (coming soon)

**Rich Display Components:**

- **HttpX**: Clickable URLs, color-coded HTTP status, technology chips
- **Nmap**: Service information, version details, fingerprint data
- **Default Display**: Automatic fallback for any plugin enrichment

**Real-time Updates:**

- Services UI polls every 15 seconds for new enrichments
- Automatic refresh when new scan data becomes available
- Live enrichment count indicators

### For Plugin Developers

The enrichment system is designed for easy extension with the **new CoreAPI Enrichment Functions**:

```javascript
// ✅ NEW: Simple enrichment API (recommended)
const enrichment_updates = results.map((result) => ({
  host: result.host, // IP address from tool
  port: result.port, // Port number from tool
  ip_protocol: "TCP", // Protocol (TCP/UDP)
  project_id: project_id, // Required for project isolation
  enrichment: {
    plugin_name: "YourPlugin", // Required for GraphQL resolution
    url: result.url, // Tool-specific data
    status_code: result.status_code,
    tech: result.tech,
    // ... other tool-specific fields
  },
}));

// Add enrichments using CoreAPI
const result = await PenPal.API.Services.AddEnrichments(enrichment_updates);
console.log(`Successfully added ${result.accepted.length} enrichments`);

// Client-side: Register custom display
import YourEnrichmentDisplay from "./components/your-enrichment-display.jsx";
PenPal.API.registerEnrichmentDisplay("YourPlugin", YourEnrichmentDisplay);
```

**Key Benefits of New API:**

- **Automatic Service Matching**: No need to manually find and match services
- **Atomic Operations**: Thread-safe enrichment updates with MongoDB atomic operators
- **Natural Identifiers**: Use host/port/protocol that tools already provide
- **Error Handling**: Detailed success/failure reporting with rejection reasons
- **Project Isolation**: Built-in multi-project support

**📖 Full Documentation**: See [Plugins/CoreAPI/README-Enrichment-API.md](Plugins/CoreAPI/README-Enrichment-API.md) for complete API reference, migration guide, and best practices.

### MQTT Event Integration

Enrichment plugins automatically respond to service discovery events:

```javascript
// Subscribe to new services from other plugins
await MQTT.Subscribe(
  PenPal.API.MQTT.Topics.New.Services,
  async ({ service_ids }) => {
    const services = await PenPal.API.Services.GetMany(service_ids);
    // Filter for relevant services and enrich them
    await enrichServices(services);
  }
);
```

This creates an intelligent **service discovery chain** where each plugin builds upon the discoveries of others, creating comprehensive service intelligence automatically.

## Plugin Ideas

- [ ] Really anything from the core
- [ ] Ping sweep for IP range (host discovery -> add hosts via API)
- [x] Nmap for service discovery for hosts or networks (host/service discovery -> add hosts/services via API)
- [x] Rustscan for service discovery for hosts or networks (host/service discovery -> add hosts/services via API)
- [x] [httpx](https://github.com/projectdiscovery/httpx) for HTTP service discovery and enrichment (service enrichment -> add HTTP metadata via API)
- [ ] Burpsuite for vulnerability scanning
- [ ] Dirb/dirbuster/insert URL discovery here
- [ ] [Gowitness](https://hub.docker.com/r/leonjza/gowitness) for screenshots of websites
- [ ] [Eyeballer](https://github.com/BishopFox/eyeballer) for searching screenshots for interesting things
- [ ] [Changeme](https://github.com/ztgrace/changeme) for default password checking

## Dependencies

PenPal is purely dependent on `docker` and `docker-compose`. It will definitely work on MacOS and maybe on Linux (does not currently support Windows)

## Running PenPal

Currently there are a number of services and endpoints that are interesting/useful. The current way to run it is by executing `dev.sh` -- if you add more plugins to the Plugins folder they will automatically mount with the `docker-compose` scripts and mount into the container. Here's a list of interesting URLs:

- **Web UI** - http://localhost:3000
- **Jobs Monitor** - http://localhost:3000/jobs (with real-time WebSocket updates)
- **GraphQL Studio** - http://localhost:3001/graphql
- **GraphQL WebSocket** - ws://localhost:3001/graphql (subscriptions)

## Jobs API - Centralized Job Management

PenPal includes a comprehensive **Jobs API** for managing long-running tasks across all plugins. This system provides real-time monitoring, progress tracking, and automatic cleanup of background jobs.

### Key Features

- **Centralized Management**: All plugin jobs are tracked in one place
- **Real-time Monitoring**: Live updates with 500ms polling
- **Multi-stage Support**: Complex jobs can be broken into trackable stages
- **Progress Tracking**: Visual progress bars and percentage completion
- **Standardized Status**: Validated status constants prevent inconsistencies
- **Automatic Cleanup**: Stale jobs are automatically marked as cancelled

### Status Constants

Always use the standardized status constants to ensure consistency across plugins:

```javascript
// ✅ CORRECT - Use status constants
PenPal.Jobs.Status.PENDING; // "pending" - Job is queued/waiting
PenPal.Jobs.Status.RUNNING; // "running" - Job is actively executing
PenPal.Jobs.Status.DONE; // "done" - Job completed successfully
PenPal.Jobs.Status.FAILED; // "failed" - Job failed with error
PenPal.Jobs.Status.CANCELLED; // "cancelled" - Job was cancelled

// Check if job is completed
const isFinished = PenPal.Jobs.CompletedStatuses.includes(job.status);

// ❌ WRONG - Don't use hardcoded strings
status: "completed"; // Invalid - use PenPal.Jobs.Status.DONE
status: "finished"; // Invalid - use PenPal.Jobs.Status.DONE
```

- **Filtering & History**: Filter by active/recent/all jobs with pagination
- **Runtime Tracking**: See how long jobs have been running
- **Completion Times**: Track when jobs finished or were cancelled

### Jobs API Usage

The Jobs API is available to all plugins through the `PenPal.Jobs` object:

```javascript
// Create a simple job
const job = await PenPal.Jobs.Create({
  name: "Network Scan",
  statusText: "Starting network scan",
  progress: 0,
});

// Update job progress
await PenPal.Jobs.UpdateProgress(job.id, 50);

// Complete the job
await PenPal.Jobs.Update(job.id, {
  progress: 100,
  status: PenPal.Jobs.Status.DONE,
  statusText: "Scan complete",
});
```

### Multi-Stage Jobs

For complex operations, jobs can include multiple stages:

```javascript
const job = await PenPal.Jobs.Create({
  name: "Comprehensive Security Scan",
  stages: [
    {
      name: "Port Scan",
      statusText: "Scanning ports",
      progress: 0,
      status: PenPal.Jobs.Status.PENDING,
    },
    {
      name: "Service Detection",
      statusText: "Detecting services",
      progress: 0,
      status: PenPal.Jobs.Status.PENDING,
    },
    {
      name: "Vulnerability Assessment",
      statusText: "Checking vulnerabilities",
      progress: 0,
      status: PenPal.Jobs.Status.PENDING,
    },
  ],
});

// Update individual stages
await PenPal.Jobs.UpdateStage(job.id, 0, {
  progress: 100,
  status: PenPal.Jobs.Status.DONE,
  statusText: "Port scan complete",
});
```

### Job Monitoring UI

Access the Jobs Monitor at **http://localhost:3000/jobs** to:

- View all running and completed jobs in real-time
- Filter jobs by status (Active, Recent, All)
- See detailed progress for multi-stage jobs
- Track job runtime and completion times
- Hide cancelled jobs with toggle option
- Browse job history with pagination

### Integration Examples

Security tools like **Nmap** and **Rustscan** use the Jobs API to provide visibility into scan progress:

```javascript
// Example from Nmap plugin
export const start_detailed_hosts_scan = async (hosts) => {
  const job = await PenPal.Jobs.Create({
    name: `Detailed Host Scan for ${hosts.length} hosts`,
    statusText: "Preparing detailed scan",
    progress: 0,
    stages: [
      {
        name: "Port Scan",
        statusText: "Scanning ports",
        progress: 0,
        status: PenPal.Jobs.Status.PENDING,
      },
      {
        name: "Service Detection",
        statusText: "Detecting services",
        progress: 0,
        status: PenPal.Jobs.Status.PENDING,
      },
      {
        name: "OS Detection",
        statusText: "Identifying operating systems",
        progress: 0,
        status: PenPal.Jobs.Status.PENDING,
      },
    ],
  });

  performScan(hosts, job.id);
  return job.id;
};
```

## BatchFunction Utility - Event Batching

PenPal includes a **BatchFunction utility** (`PenPal.Utils.BatchFunction`) for batching rapid function calls together, essential for handling high-frequency MQTT events during large scans without overwhelming system resources.

### The Problem

During large network scans, plugins can receive hundreds of rapid MQTT events as services are discovered:

```javascript
// ❌ Problem: Each event triggers separate processing
await MQTT.Subscribe(PenPal.API.MQTT.Topics.New.Services, ({ service_ids }) => {
  // This fires 100+ times during a large scan
  processServices(service_ids); // Creates many jobs, containers, etc.
});
```

### The Solution

BatchFunction collects rapid calls and processes them together after a timeout period:

```javascript
// ✅ Solution: Batch events together with 5-second timeout
await MQTT.Subscribe(
  PenPal.API.MQTT.Topics.New.Services,
  PenPal.Utils.BatchFunction(processBatchedServices, 5000)
);

const processBatchedServices = async (batchedArgs) => {
  console.log(`Processing ${batchedArgs.length} batched events`);

  // Deduplicate service IDs across all events
  const allServiceIds = new Set();
  for (const [{ service_ids }] of batchedArgs) {
    service_ids.forEach((id) => allServiceIds.add(id));
  }

  // Process all unique services in one operation
  await processServices(Array.from(allServiceIds));
};
```

### How It Works

1. **Collect Arguments**: Each function call adds its arguments to an internal array
2. **Reset Timer**: Each new call resets the timeout timer
3. **Execute Handler**: After timeout period with no new calls, executes handler with all batched arguments
4. **Clear Batch**: Resets for the next batch cycle

### Function Signature

```javascript
const batchedFunction = PenPal.Utils.BatchFunction(handler, timeoutMs);
```

**Parameters:**

- `handler` - Function that receives an array of batched argument sets
- `timeoutMs` - Timeout in milliseconds to wait after last call before executing

### Real-world Performance Impact

**HttpX Plugin Example** - Before and after BatchFunction implementation:

**Before (Individual Processing):**

- 🔴 200+ separate Docker containers spawned during large scans
- 🔴 200+ individual jobs created
- 🔴 Overwhelming system resources and MQTT broker
- 🔴 Processing duplicate service IDs multiple times

**After (Batched Processing):**

- ✅ 1 Docker container per project with bulk service list
- ✅ 1 job per project with comprehensive progress tracking
- ✅ Automatic deduplication of service IDs
- ✅ 90%+ reduction in resource usage

### Configuration Guidelines

Choose timeout values based on your use case:

- **1-2 seconds**: Real-time operations requiring quick response
- **5-10 seconds**: Service discovery and enrichment (recommended)
- **30+ seconds**: Non-critical background processing

### Benefits

- **Resource Optimization**: Dramatically reduces Docker container and job creation
- **Deduplication**: Automatically handles duplicate data across events
- **Bulk Processing**: Enables efficient batch operations
- **System Stability**: Prevents overwhelming during scan bursts
- **Better Performance**: 90%+ reduction in overhead for high-frequency events

### Migration Pattern

Converting existing event handlers to use BatchFunction:

```javascript
// Step 1: Modify handler to accept batched arguments
const processBatchedEvents = async (batchedArgs) => {
  for (const [originalArgs] of batchedArgs) {
    // Process each original argument set
    // Or group/deduplicate across all arguments
  }
};

// Step 2: Wrap with BatchFunction
const batchedHandler = PenPal.Utils.BatchFunction(processBatchedEvents, 5000);

// Step 3: Use in MQTT subscriptions
await MQTT.Subscribe(topic, batchedHandler);
```

The BatchFunction utility is essential for building scalable plugins that can handle the rapid event streams generated during large cybersecurity scans.

## Real-time Updates with GraphQL Subscriptions

PenPal includes **WebSocket-based GraphQL subscriptions** for real-time updates while maintaining full Apollo Client compatibility. This enables live monitoring of jobs, scan progress, and service discoveries without polling.

### Key Features

- **WebSocket Transport**: Real-time updates via GraphQL subscriptions
- **Apollo Client Compatible**: Seamless integration with existing queries/mutations
- **Split Link Transport**: Automatic routing of subscriptions to WebSocket, queries/mutations to HTTP
- **Graceful Fallback**: Falls back to polling if WebSocket connection fails
- **PubSub Events**: Server-side event publishing for plugin communications

### WebSocket Endpoints

- **GraphQL HTTP**: `http://localhost:3001/graphql` (queries, mutations)
- **GraphQL WebSocket**: `ws://localhost:3001/graphql` (subscriptions)
- **Client Auto-routing**: Apollo Client automatically chooses transport based on operation type

### Real-time Job Monitoring

The Jobs UI includes real-time updates that eliminate the need for manual polling:

```javascript
// JobsCounter component in navbar shows live active job count
const { data } = useSubscription(ACTIVE_JOBS_SUBSCRIPTION, {
  onData: ({ data }) => {
    if (data?.data?.activeJobsChanged) {
      setActiveJobs(data.data.activeJobsChanged);
      setJobCount(data.data.activeJobsChanged.length);
    }
  },
  onError: (error) => {
    console.warn("Subscription failed, falling back to polling:", error);
    // Automatic fallback to polling
  },
});
```

### Subscription Examples

**Job Status Updates:**

```graphql
subscription ActiveJobsChanged {
  activeJobsChanged {
    id
    name
    plugin
    progress
    status
    updated_at
  }
}
```

**Service Discovery Events:**

```graphql
subscription NewServicesDiscovered($projectId: ID!) {
  newServicesDiscovered(projectId: $projectId) {
    project_id
    services {
      id
      host_ip
      port
      protocol
      status
    }
  }
}
```

### Plugin Integration

Plugins can publish real-time events using the built-in PubSub system:

```javascript
// Server-side: Publish events when data changes
export const updateJob = async (job_id, updates) => {
  const result = await PenPal.DataStore.updateOne(
    "JobsTracker",
    "Jobs",
    { id: job_id },
    updates
  );

  // Real-time notification
  if (PenPal.PubSub) {
    const updatedJob = await getJob(job_id);
    PenPal.PubSub.publish("JOB_UPDATED", { jobUpdated: updatedJob });

    // Aggregate events for efficiency
    const activeJobs = await getActiveJobs();
    PenPal.PubSub.publish("ACTIVE_JOBS_CHANGED", {
      activeJobsChanged: activeJobs,
    });
  }

  return result;
};
```

### Real-time Features

**Live Job Counter**: The navbar displays a real-time badge showing active job count with spinning icon for running jobs

**Instant Updates**: Job status changes appear immediately across all connected clients

**Service Discovery**: New hosts, services, and scan results appear in real-time as they're discovered

**Progress Tracking**: Multi-stage job progress updates live without page refresh

### Performance Benefits

- **Reduced Server Load**: Eliminates constant polling requests
- **Instant Feedback**: Updates appear immediately when events occur
- **Bandwidth Efficient**: Only sends data when changes happen
- **Better UX**: Live updates provide immediate feedback on scan progress

## Docker Plugin - Container Orchestration

PenPal includes a powerful **Docker Plugin** that provides essential container orchestration capabilities for running cybersecurity tools in isolated environments. This plugin is fundamental for security tools like **Nmap**, **HttpX**, **Rustscan**, and other containerized scanners.

### Key Features

- **Automatic Image Building**: Builds Docker images from plugin contexts during startup
- **Container Lifecycle Management**: Start, stop, wait, and manage container execution
- **Volume Management**: Secure file exchange between host and containers
- **Network Isolation**: All containers run in isolated `penpal_penpal` network
- **Resource Management**: Ephemeral containers with automatic cleanup
- **Multi-tool Support**: Orchestrates multiple security tools simultaneously

### Docker Configuration

Plugins configure Docker settings in their `plugin.js` files:

```javascript
// ✅ CORRECT Docker configuration
export const settings = {
  docker: {
    name: "penpal:httpx", // Container image name
    dockercontext: `${__dirname}/docker-context`, // Build context path
  },
};

// ✅ Alternative: Use pre-built images
export const settings = {
  docker: {
    name: "penpal:nmap",
    image: "instrumentisto/nmap:latest", // Pull existing image
  },
};
```

### Container Execution Pattern

The Docker plugin provides a standardized pattern for running security tools:

```javascript
// ✅ Standard containerized security tool execution
export const performScan = async ({ targets, project_id }) => {
  // 1. Prepare shared volume directory
  const outdir = `/penpal-plugin-share/toolname/${project_id}`;
  PenPal.Utils.MkdirP(outdir);

  // 2. Create input files on host
  const targets_file = path.join(outdir, `targets-${PenPal.Utils.Epoch()}.txt`);
  fs.writeFileSync(targets_file, targets.join("\n"));

  // 3. Define output file path
  const output_file = path.join(outdir, `results-${PenPal.Utils.Epoch()}.json`);

  // 4. Convert to container paths (volume mount)
  const container_targets = targets_file.replace(
    "/penpal-plugin-share",
    "/penpal-plugin-share"
  );
  const container_output = output_file.replace(
    "/penpal-plugin-share",
    "/penpal-plugin-share"
  );

  // 5. Run containerized tool
  const result = await PenPal.Docker.Run({
    image: "penpal:httpx",
    cmd: `-l ${container_targets} -o ${container_output} -json`,
    daemonize: true, // Run in background
    network: "penpal_penpal", // Isolated network
    volume: {
      // Shared volume mount
      name: "penpal_penpal-plugin-share",
      path: "/penpal-plugin-share",
    },
  });

  // 6. Wait for completion
  const container_id = result.stdout.trim();
  await PenPal.Docker.Wait(container_id);

  // 7. Process results
  const results = fs.readFileSync(output_file, "utf8");
  return JSON.parse(results);
};
```

### Docker API Methods

The Docker plugin exposes comprehensive container management APIs:

```javascript
// Container lifecycle
await PenPal.Docker.Run(options); // Create and run container
await PenPal.Docker.Start(container_id); // Start stopped container
await PenPal.Docker.Stop(container_id); // Stop running container
await PenPal.Docker.Wait(container_id); // Wait for completion

// Container operations
await PenPal.Docker.Exec({ container, cmd }); // Execute command in container
await PenPal.Docker.Copy({ container, container_file, output_file }); // Copy files

// Image management
await PenPal.Docker.Build(docker_config); // Build image from context
await PenPal.Docker.Pull({ image }); // Pull pre-built image

// Cleanup
await PenPal.Docker.RemoveContainer(container_id); // Remove container

// Advanced
await PenPal.Docker.Raw(docker_command); // Execute raw docker command
```

### Security and Isolation

**Network Isolation:**

- All containers run in the `penpal_penpal` network
- Isolated from host network by default
- Can communicate with other PenPal services (databases, APIs)
- No direct internet access unless explicitly configured

**Volume Security:**

- Shared volumes use specific mount points (`/penpal-plugin-share`)
- No access to host filesystem outside mounted volumes
- Temporary files automatically cleaned up after scans
- Prevents container escape and data exfiltration

**Resource Management:**

- Containers are ephemeral and removed after use
- No persistent state stored in containers
- Resource limits can be enforced per container
- Automatic cleanup prevents resource exhaustion

### Integration with Security Tools

The Docker plugin enables seamless integration of popular cybersecurity tools:

**Nmap Integration:**

```javascript
// Nmap plugin uses Docker for isolated network scanning
const result = await PenPal.Docker.Run({
  image: "penpal:nmap",
  cmd: `-sS -sV -O ${targets} -oX ${output_file}`,
  network: "penpal_penpal",
  volume: { name: "penpal_penpal-plugin-share", path: "/penpal-plugin-share" },
});
```

**HttpX Integration:**

```javascript
// HttpX plugin uses Docker for HTTP service discovery
const result = await PenPal.Docker.Run({
  image: "penpal:httpx",
  cmd: `-l ${targets_file} -json -title -tech-detect`,
  network: "penpal_penpal",
  volume: { name: "penpal_penpal-plugin-share", path: "/penpal-plugin-share" },
});
```

**Rustscan Integration:**

```javascript
// Rustscan plugin uses Docker for fast port scanning
const result = await PenPal.Docker.Run({
  image: "penpal:rustscan",
  cmd: `-a ${targets} --ports ${ports} -- -sV`,
  network: "penpal_penpal",
  volume: { name: "penpal_penpal-plugin-share", path: "/penpal-plugin-share" },
});
```

### Dockerfile Best Practices

PenPal plugins use multi-stage Docker builds for security and efficiency:

```dockerfile
# ✅ Example: HttpX plugin Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
RUN go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /go/bin/httpx .
ENTRYPOINT ["./httpx"]
```

**Key principles:**

- **Multi-stage builds** to minimize final image size
- **Alpine Linux** base images for security and size
- **Specific tool versions** for reproducibility
- **Minimal attack surface** with only required dependencies
- **Non-root execution** where possible

### Plugin Dependencies

Plugins using Docker must declare the dependency:

```json
{
  "name": "HttpX",
  "version": "0.1.0",
  "dependsOn": ["CoreAPI@0.1.0", "Docker@0.1.0", "JobsTracker@0.1.0"]
}
```

### Automatic Image Building

The Docker plugin automatically:

1. **Validates** plugin Docker configurations during startup
2. **Builds** images from `docker-context/` directories
3. **Pulls** pre-built images if specified
4. **Caches** built images for subsequent runs
5. **Reports** build status and errors

This ensures all required container images are available before plugins attempt to use them.

### Volume Management

**Shared Volume Pattern:**

- All plugins use the `penpal_penpal-plugin-share` volume
- Host path: `/penpal-plugin-share/`
- Container path: `/penpal-plugin-share/`
- Plugin-specific subdirectories: `/penpal-plugin-share/toolname/project_id/`

**File Exchange Pattern:**

```javascript
// ✅ Correct volume path handling
const host_path = "/penpal-plugin-share/httpx/project1/targets.txt";
const container_path = host_path; // Same path due to volume mount

// ❌ Wrong - hardcoded paths won't work
const bad_path = "/tmp/targets.txt"; // Not accessible in container
```

### Error Handling and Monitoring

The Docker plugin integrates with PenPal's monitoring systems:

```javascript
// ✅ Proper error handling with Jobs API
const job = await PenPal.Jobs.Create({
  name: "HTTP Service Scan",
  statusText: "Starting containerized scan",
});

try {
  const result = await PenPal.Docker.Run(docker_config);
  await PenPal.Docker.Wait(result.stdout.trim());

  await PenPal.Jobs.Update(job.id, {
    status: PenPal.Jobs.Status.DONE,
    statusText: "Scan completed successfully",
  });
} catch (error) {
  await PenPal.Jobs.Update(job.id, {
    status: PenPal.Jobs.Status.FAILED,
    statusText: `Container execution failed: ${error.message}`,
  });
}
```

The Docker plugin is essential for PenPal's microservices architecture, enabling secure, isolated execution of cybersecurity tools while maintaining seamless integration with the broader platform.

## Centralized Logger System

PenPal provides a **sophisticated centralized logging system** that automatically assigns unique colors to each plugin and ensures consistent formatting across the entire platform. This replaces manual console.log statements with a professional, maintainable logging solution.

### Key Features

- **🎨 Automatic Color Assignment**: Each plugin gets a unique, consistent color based on plugin name hash
- **📝 Consistent Formatting**: ISO 8601 timestamps and automatic `[PluginName]` prefixes in assigned colors
- **🔧 Easy Integration**: File-level logger exports that can be imported anywhere within a plugin
- **🚀 Multiple Log Levels**: `log`, `info`, `warn`, `error`, `debug` with appropriate colors
- **⚡ Drop-in Replacement**: Simple migration from existing console.log statements

### Quick Example

**Before (Manual Console Logging):**

```javascript
console.log("[HttpX] Starting HTTP scan for 25 targets");
console.error("[HttpX] Scan failed: Connection timeout");
console.log("[+] HttpX scan completed successfully");
```

**After (Centralized Logger):**

```javascript
logger.log("Starting HTTP scan for 25 targets");
logger.error("Scan failed: Connection timeout");
logger.log("Scan completed successfully");
```

**Output:**

```
2024-01-15T10:30:45.123Z [HttpX] Starting HTTP scan for 25 targets
2024-01-15T10:30:46.456Z [HttpX] Scan failed: Connection timeout
2024-01-15T10:30:47.789Z [HttpX] Scan completed successfully
```

### Implementation Pattern

**1. Create File-Level Logger Export** (in `plugin.js`):

```javascript
import PenPal from "#penpal/core";

// File-level logger that can be imported by other files
export const YourPluginLogger = PenPal.Utils.BuildLogger("YourPlugin");

const YourPlugin = {
  async loadPlugin() {
    YourPluginLogger.log("Plugin loading started");
    // ... plugin code
    return { settings };
  },
};

export default YourPlugin;
```

**2. Import in Other Plugin Files**:

```javascript
import { YourPluginLogger as logger } from "./plugin.js";

export const performOperation = async () => {
  logger.log("Starting operation");

  try {
    // Operation logic
    logger.info("Operation completed successfully");
  } catch (error) {
    logger.error("Operation failed:", error.message);
  }
};
```

### Migration Benefits

- **Consistent Formatting**: All plugins use the same timestamp and prefix format
- **Unique Colors**: Easy visual identification of different plugins in logs
- **Reduced Maintenance**: No manual prefix management or formatting
- **Better Debugging**: Clear plugin attribution for all log messages
- **Professional Output**: Clean, consistent logging across the entire system

**📖 Complete Documentation**: See [docs/LOGGER.md](docs/LOGGER.md) for full implementation guide, migration steps, API reference, and best practices.

## Plugin Development

Below is documentation describing how plugins should be structured and what is required. Plugins are loaded live by the Vite (client) and Node (server) dynamically, so simply placing the plugin in the `plugins/` folder will let you get started. Use the `penpal-plugin-develop.py` python script to get a Template with a name put into the right place.

```
python3 penpal-plugin-develop.py --new-plugin --name MySuperCoolAwesomePlugin
```

### Plugin structure (server)

Each plugin is required to have three server files: `index.js`, `manifest.json`, and `plugin.js`. In general, the `index.js` will register the plugin, the `manifest.json` describes the plugin, and the the `plugin.js` implements the plugin. The simplest possible plugin is shown in the snippets below:

File Structure:

```
plugins/
|-> Base/
|-> CoreAPI/
|-> YourPlugin/
|   |-> install-dependencies.sh (optional shell script that will be automatically called if you need things like npm packages)
|   |-> server/
|   |   |-> index.js
|   |   |-> manifest.json
|   |   |-> plugin.js
```

`index.js`:

```js
// The code below is used to register a plugin (at runtime), which will then be loaded
// once the main server finishes starting up.

// Overall PenPal coordinating server code
import PenPal from "#penpal/core";

// Plugin-specific info
import Plugin from "./plugin.js";
import Manifest from "./manifest.json" with { type: "json" };

// Register the plugin
PenPal.registerPlugin(Manifest, Plugin);
```

`manifest.json`:

```json
{
  "name": "MyCoolPlugin",
  "version": "0.1.0",
  "dependsOn": ["AnotherPlugin@0.1.0"]
}
```

`plugin.js`:

```js
// This defines the custom server-side code being run by the plugin. It has GraphQL schemas and resolvers
// in order to interact with the plugged application
import { types, resolvers, loaders } from "./graphql";

const settings = {};

const MyCoolPlugin = {
  loadPlugin() {
    // Required
    return {
      graphql: {
        // Optional
        types, // Optional
        resolvers, // Optional
        loaders, // Optional
      },
      settings, // Optional
      hooks: {
        // Optional
        settings: {}, // Optional
        postload: () => null, // Optional
        startup: () => null, // Optional
      },
    };
  },
};

export default MyCoolPlugin;
```

### Plugin API

`PenPal`

- `registerPlugin(manifest, plugin)` - this function registers the plugin with PenPal for it to be loaded. It takes two arguments:
  - `manifest` (required) - an object containing decriptive fields about the plugin, defined in the `Manifest` section below
  - `plugin` (required) - an object containing fields that associate with the code of the plugin, defined in the `Plugin` section below

`Manifest`

- `name` (required) - a `String` that is a unique name for the plugin
- `version` (required) - a `String` in semantic versioning form
- `load` (optional) - a `Boolean` that can be set to `false` to disable and not load a plugin. Defaults to true
- `dependsOn` (required) - a `[String]` where each `String` is of the form `name@version` for plugins. Your plugin will not load if any of the dependencies are missing
- `requiresImplementation` (optional) - a `Boolean` specifying whether another plugin must implement this one in order to load. This is currently used by the `DataStore` plugin, which defines a general API for interacting with data store plugins but does not actually implement one.
- `implements` (optional) - a `String` of the form `name@version` that specifies if the plugin implements another plugins specification. For example, `DataStoreMongoAdapter` implements the `DataStore` specification.

`Plugin`

- `loadPlugin()` - This function takes no arguments and returns one object with `types`, `resolvers`, `loaders`, and `settings` fields to define the schema and resolvers that can be used to interact with the plugin. The settings object contains all of the specific info that defines how the plugin queries will interact with the user interface and other server-side APIs (more on this in the `Settings` section).

### Hooks

The hooks property that is returned from the `loadPlugin` function allows you to pass in functions that can be called to validate and/or execute code when other plugins are loaded. The three hooks available are described below.

#### Startup

`startup` - This function takes no arguments but is guaranteed to execute _after_ all other plugins have been loaded and after all core services are running (databases, the GraphQL server, etc).

```js
hooks: {
  startup: () => null;
}
```

#### Settings

`settings` - This hook takes an object where each key describes a section of the `settings` object (described later) and the value is a function that is used to validate the settings in question. For example, the `Docker` plugin uses this hook in [Plugins/Docker/server/plugin.js](https://github.com/jchristman/PenPal/blob/master/Plugins/Docker/server/plugin.js#L64) to check other plugins' usage of the `docker` field of the settings object.

```js
hooks: {
  settings: {
    my_cool_settings_field: check_my_cool_settings_field;
  }
}
```

#### Postload

`postload` - This hook will fire after a plugin loads with a single argument of the `plugin_name`. This can be used to take settings information and do _something_ with it. For example, the `DataStore` plugin uses this hook in [Plugins/DataStore/server/plugin.js](https://github.com/jchristman/PenPal/blob/master/Plugins/DataStore/server/plugin.js#L33) to fire a function that creates datastores for each plugin immediately after they are loaded. We do this after the plugin is loaded because we know all of its dependencies exist and before the startup hook in order to make sure that everything is ready for those hooks to fire.

```js
hooks: {
  postload: (plugin_name) => null;
}
```

### Settings

The sections below enumerate the different settings available and what they do. Much of this is subject to change, so take the documentation with a grain of salt and look at examples for current functionality.

#### Configuration (unstable atm)

To utilize the automatic configuration page generator, utilize the following field in the settings object, which will allow PenPal to introspect your schema and generate a configuration editor

```json
{
  "configuration": {
    "schema_root": "MyCoolPluginConfiguration",
    "getter": "getMyCoolPluginConfiguration",
    "setter": "setMyCoolPluginConfiguration"
  }
}
```

#### Datastore

This section of the settings object is used to automatically generate data stores (using the DataStore API). It can be used for actual PenPal data or just configuration information for your plugin. The `datastores` field of the `settings` object is an `[Object]` where each `Object` has a `name` field. The `name` is automatically prepended with your plugin name, so it is automatically namespaced. There is planned functionality for things like unique data stores for data types (S3 stores for `files`, relational DB for data, etc), but that is not yet implemented.

```json
{
  "datastores": [
    {
      "name": "YourCollectionName"
    }
  ]
}
```

#### Docker

This section of the settings object is used to automatically pull docker images (not yet implemented) or build provided docker files (implemented) at runtime. This is an easy way to make sure that your particular plugin is cross platform and can be executed regardless of where PenPal is running. See the [Rustscan Plugin](https://github.com/jchristman/PenPal/blob/master/Plugins/Rustscan/server/plugin.js#L7) for an example.

### GraphQL

The `graphql` field of the `loadPlugin` return value can have any of three fields: `types`, `resolvers`, and `loaders`. These are automatically merged into the overall GraphQL schema to add API endpoints that are accessible on the `/graphql` endpoint.

#### GraphQL Schema Loading Pattern

**✅ CRITICAL: Correct GraphQL Structure**

Plugins with GraphQL schemas must follow the established loading pattern used by CoreAPI, Nmap, and other plugins:

```javascript
// ✅ CORRECT: graphql/index.js
export { default as loadGraphQLFiles } from "./schema/index.js";
export { default as resolvers } from "./resolvers.js";

// ❌ WRONG - Don't import from penpal/core
import { loadGraphQLFiles } from "#penpal/core"; // This function doesn't exist!
```

**Required File Structure:**

```
server/graphql/
├── index.js                    // Main GraphQL exports
├── resolvers.js               // Resolver structure
├── schema/
│   ├── index.js               // loadGraphQLFiles implementation
│   └── enrichment.schema.graphql  // Plugin-specific types (MUST contain valid GraphQL)
└── resolvers/
    ├── index.js               // Resolver exports
    └── enrichment.default.js  // Plugin resolvers
```

**⚠️ IMPORTANT: GraphQL File Requirements**

- All `.graphql` files MUST contain valid GraphQL definitions (types, queries, mutations, etc.)
- Files with only comments will cause "Unexpected <EOF>" syntax errors
- Remove empty schema files or add minimal valid definitions
- Use descriptive filenames like `plugin-name-enrichment.schema.graphql`

**Schema Loading Implementation:**

```javascript
// ✅ CORRECT: graphql/schema/index.js
import PenPal from "#penpal/core";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const cur_dir = join(__dirname, ".");

const loadGraphQLFiles = async () => {
  return PenPal.Utils.LoadGraphQLDirectories(cur_dir);
};

export default loadGraphQLFiles;
```

**Resolver Structure:**

```javascript
// ✅ CORRECT: graphql/resolvers.js
import resolvers from "./resolvers/index.js";

export default [
  {
    Query: {
      ...resolvers.queries,
    },
  },
  {
    Mutation: {
      ...resolvers.mutations,
    },
  },
  ...resolvers.default_resolvers,
  ...resolvers.scalars,
];

// ✅ CORRECT: graphql/resolvers/index.js
export default {
  queries: {
    // Custom queries
  },
  mutations: {
    // Custom mutations
  },
  default_resolvers: [/* resolver functions */],
  scalars: [],
};
```

**Plugin Integration:**

```javascript
// ✅ CORRECT: plugin.js
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";

const YourPlugin = {
  loadPlugin() {
    return {
      graphql: {
        types: loadGraphQLFiles,
        resolvers,
      },
    };
  },
};
```

This pattern ensures proper GraphQL schema loading and integration with PenPal's plugin system. The `PenPal.Utils.LoadGraphQLDirectories()` function automatically discovers and loads all `.graphql` files in the schema directory.

#### Plugin Registration

**✅ CRITICAL: Plugin Registration Pattern**

Every plugin MUST have an `index.js` file that registers the plugin with PenPal:

```javascript
// ✅ CORRECT: server/index.js
// Overall PenPal coordinating server code
import PenPal from "#penpal/core";

// Plugin-specific info
import Plugin from "./plugin.js";
import Manifest from "./manifest.json" with { type: "json" };

// Register the plugin
PenPal.registerPlugin(Manifest, Plugin);

// ❌ WRONG - Don't export anything
export default Plugin; // Remove this line
```

**Key Requirements:**

- Import `PenPal` from `#penpal/core`
- Import `Plugin` from `./plugin.js`
- Import `Manifest` from `./manifest.json` with JSON assertion
- Call `PenPal.registerPlugin(Manifest, Plugin)`
- No exports needed - registration is a side effect

This registration pattern is what actually loads your plugin into the PenPal system. Without it, your plugin will not be recognized or loaded.

#### GraphQL Subscription Resolvers

**✅ CRITICAL: Correct Subscription Resolver Pattern**

For real-time GraphQL subscriptions, use the **object pattern with `subscribe` method**:

```javascript
// ✅ CORRECT: Object resolvers with subscribe method
export default {
  jobUpdated: {
    subscribe: (parent, args, context) => {
      if (!context?.pubsub) {
        throw new Error("PubSub not available in subscription context");
      }
      return context.pubsub.asyncIterator(["JOB_UPDATED"]);
    }
  },

  activeJobsChanged: {
    subscribe: (parent, args, context) => {
      return context.pubsub.asyncIterator(["ACTIVE_JOBS_CHANGED"]);
    }
  }
};

// ❌ WRONG: Direct function resolvers (will fail)
export default {
  async jobUpdated(parent, args, context) {
    return context.pubsub.asyncIterator(["JOB_UPDATED"]); // Causes "must return Async Iterable" error
  }
};
```

**Why This Matters:**

- GraphQL requires subscription resolvers to return async iterables
- The function pattern fails with "Subscription field must return Async Iterable. Received: undefined."
- The object pattern with `subscribe` method is the GraphQL specification standard
- Using the wrong pattern causes WebSocket disconnections with 4500 error codes

**Subscription Schema:**

```graphql
extend type Subscription {
  jobUpdated: Job
  activeJobsChanged: [Job]
}
```

**Publishing Events:**

```javascript
// Server-side: Publish real-time updates
PenPal.PubSub.publish("JOB_UPDATED", { jobUpdated: updatedJob });
PenPal.PubSub.publish("ACTIVE_JOBS_CHANGED", { activeJobsChanged: activeJobs });
```
