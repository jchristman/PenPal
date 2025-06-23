# HttpX Plugin

The HttpX plugin provides HTTP service discovery and enrichment capabilities for PenPal. It automatically identifies HTTP services running on open ports discovered by other scanning plugins.

## Overview

This plugin:

- **Listens for new services** via MQTT subscription to `PenPal.API.MQTT.Topics.New.Services`
- **Filters for TCP services** with open ports that might be HTTP services
- **Runs httpx scans** in Docker containers to probe for HTTP services
- **Enriches service data** with HTTP-specific information (titles, server headers, technologies, etc.)
- **Uses JobTracker** for centralized job management and progress tracking

## Features

- **Automatic Triggering**: Responds to newly discovered services from network scans
- **Docker Orchestration**: Runs httpx in isolated Docker containers
- **Comprehensive HTTP Probing**: Detects HTTP/HTTPS services, extracts metadata
- **Service Enrichment**: Adds HTTP-specific data to existing service records
- **Job Management**: Integrates with PenPal's centralized job tracking system

## Dependencies

- CoreAPI@0.1.0 - For service data management
- Docker@0.1.0 - For container orchestration
- JobsTracker@0.1.0 - For job management

## Installation

The plugin is currently disabled by default (`"load": false` in manifest.json). To enable:

1. Set `"load": true` in `Plugins/HttpX/server/manifest.json`
2. Build the Docker image: The Docker plugin will automatically build the httpx container
3. Restart the PenPal server

## How It Works

### 1. Service Discovery Trigger

When other plugins (like Nmap) discover new services, they publish to the MQTT topic `PenPal.API.MQTT.Topics.New.Services`. The HttpX plugin subscribes to this topic.

### 2. Service Filtering

The plugin filters incoming services to only process:

- TCP protocol services
- Services with `status: 'open'`
- Services with valid port numbers

### 3. HTTP Scanning

For each qualifying service, the plugin:

- Creates target URLs (both HTTP and HTTPS variants)
- Runs httpx in a Docker container with comprehensive flags:
  - JSON output format
  - Title extraction
  - Technology detection
  - Server header capture
  - Response metadata collection

### 4. Data Enrichment

Results are parsed and used to enrich the original service records with:

- Full URLs discovered
- HTTP status codes
- Content types and lengths
- HTML page titles
- Server information
- Detected technologies
- Response metadata

### 5. Job Tracking

All operations are tracked through the JobTracker system, providing:

- Progress updates during scanning
- Status reporting
- Error handling
- Centralized monitoring

## Configuration

The plugin uses these Docker settings:

- **Image**: `penpal:httpx` (built from `docker-context/Dockerfile`)
- **Network**: `penpal_penpal`
- **Volume**: Shared volume for file I/O with host system

## Output

The plugin enriches services with `HttpXPluginEnrichment` data containing:

- `url`: Full discovered URL
- `status_code`: HTTP response code
- `content_type`: Response content type
- `content_length`: Response size
- `title`: HTML page title
- `server`: Server header value
- `tech`: Array of detected technologies
- `method`: HTTP method used
- `scheme`: Protocol (http/https)
- `path`: URL path component

## GraphQL Schema

The plugin extends the PenPal GraphQL schema with the `HttpXPluginEnrichment` type, allowing HTTP service data to be queried through the standard service enrichments interface.

## Example Usage

Once enabled, the plugin will automatically:

1. **Detect new services**: When Nmap discovers port 80 open on 192.168.1.100
2. **Trigger HTTP scan**: HttpX probes http://192.168.1.100:80 and https://192.168.1.100:80
3. **Capture metadata**: Extracts title, server info, technologies, etc.
4. **Enrich service**: Adds HTTP enrichment data to the service record
5. **Track progress**: Shows job status in the PenPal jobs interface

The enriched data becomes available in GraphQL queries and the PenPal UI, providing valuable context about discovered HTTP services.
