# PenPal Service Enrichment API

The PenPal Service Enrichment API provides a standardized way for security tool plugins to add rich metadata to discovered services. This API eliminates complex service matching logic and provides atomic, thread-safe enrichment operations.

## Overview

The enrichment system allows plugins to:

- **Add contextual data** to services discovered by other plugins
- **Build comprehensive service intelligence** by layering data from multiple tools
- **Maintain data integrity** through atomic database operations
- **Work with natural identifiers** (host/port/protocol) instead of internal IDs

## Quick Start

### Basic Enrichment Pattern

```javascript
// 1. Parse tool output
const results = parseToolOutput(output_data);

// 2. Convert to enrichment format
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

// 3. Add enrichments using CoreAPI
const result = await PenPal.API.Services.AddEnrichments(enrichment_updates);
console.log(`Successfully added ${result.accepted.length} enrichments`);
```

## API Functions

### `AddEnrichments(enrichments_array)`

**Purpose**: Add multiple enrichments in a single atomic operation.

**Parameters**:

```javascript
enrichments_array: [
  {
    // Service identification (choose one method):

    // Method 1: Host/Port/Protocol (RECOMMENDED)
    host: "192.168.1.100", // IP address (string)
    port: 80, // Port number (integer)
    ip_protocol: "TCP", // Protocol: "TCP" or "UDP"
    project_id: "project_123", // Project ID (required)

    // Method 2: Service ID (backward compatibility)
    // service_id: "service_456",

    // Enrichment data
    enrichment: {
      plugin_name: "YourPlugin", // Required for GraphQL interface
      // ... your plugin-specific fields
    },
  },
];
```

**Returns**:

```javascript
{
  accepted: [                        // Successfully processed enrichments
    {
      selector: { host, port, ip_protocol, project_id },
      enrichment: { /* enrichment data */ }
    }
  ],
  rejected: [                        // Failed enrichments with error details
    {
      selector: { host, port, ip_protocol, project_id },
      enrichment: { /* enrichment data */ },
      error: "Service not found matching criteria"
    }
  ]
}
```

**Example**:

```javascript
const result = await PenPal.API.Services.AddEnrichments([
  {
    host: "192.168.1.100",
    port: 80,
    ip_protocol: "TCP",
    project_id: project_id,
    enrichment: {
      plugin_name: "HttpX",
      url: "http://192.168.1.100",
      status_code: 200,
      title: "Apache Web Server",
      tech: ["Apache", "PHP"],
    },
  },
  {
    host: "192.168.1.100",
    port: 443,
    ip_protocol: "TCP",
    project_id: project_id,
    enrichment: {
      plugin_name: "HttpX",
      url: "https://192.168.1.100",
      status_code: 200,
      title: "Secure Web Server",
    },
  },
]);
```

### `AddEnrichment(enrichment_object)`

**Purpose**: Add a single enrichment.

**Parameters**: Same as single object from `AddEnrichments` array.

**Example**:

```javascript
await PenPal.API.Services.AddEnrichment({
  host: "10.0.0.1",
  port: 22,
  ip_protocol: "TCP",
  project_id: project_id,
  enrichment: {
    plugin_name: "Nmap",
    service: "ssh",
    product: "OpenSSH",
    version: "8.9p1",
    fingerprint: "SSH-2.0-OpenSSH_8.9p1",
  },
});
```

### `UpdateEnrichment(update_params)`

**Purpose**: Update an existing enrichment from a specific plugin.

**Parameters**:

```javascript
{
  // Service identification
  host: "192.168.1.100",
  port: 80,
  ip_protocol: "TCP",
  project_id: project_id,

  // Plugin identification
  plugin_name: "HttpX",               // Which plugin's enrichment to update

  // Updates to apply
  updates: {
    status_code: 404,                 // New/updated fields
    last_checked: new Date().toISOString(),
    error_message: "Not Found"
  }
}
```

**Example**:

```javascript
await PenPal.API.Services.UpdateEnrichment({
  host: "192.168.1.100",
  port: 80,
  ip_protocol: "TCP",
  project_id: project_id,
  plugin_name: "HttpX",
  updates: {
    status_code: 503,
    last_checked: new Date().toISOString(),
    error_message: "Service Unavailable",
  },
});
```

### `UpsertEnrichment(enrichment_object)`

**Purpose**: Add enrichment if it doesn't exist, update if it does (by plugin_name).

**Parameters**: Same as `AddEnrichment`.

**Example**:

```javascript
await PenPal.API.Services.UpsertEnrichment({
  host: "192.168.1.100",
  port: 80,
  ip_protocol: "TCP",
  project_id: project_id,
  enrichment: {
    plugin_name: "HttpX",
    url: "http://192.168.1.100",
    status_code: 200,
    title: "Updated Web Server",
    last_scan: new Date().toISOString(),
  },
});
```

### `RemoveEnrichment(remove_params)`

**Purpose**: Remove an enrichment from a specific plugin.

**Parameters**:

```javascript
{
  // Service identification
  host: "192.168.1.100",
  port: 80,
  ip_protocol: "TCP",
  project_id: project_id,

  // Plugin identification
  plugin_name: "HttpX"                // Which plugin's enrichment to remove
}
```

**Example**:

```javascript
await PenPal.API.Services.RemoveEnrichment({
  host: "192.168.1.100",
  port: 80,
  ip_protocol: "TCP",
  project_id: project_id,
  plugin_name: "HttpX",
});
```

## Service Identification Methods

### Method 1: Host/Port/Protocol (Recommended)

Use natural identifiers that security tools already provide:

```javascript
{
  host: "192.168.1.100",        // IP address (string)
  port: 80,                     // Port number (integer)
  ip_protocol: "TCP",           // Protocol: "TCP" or "UDP"
  project_id: project_id,       // Project ID for isolation
  enrichment: { /* ... */ }
}
```

**Benefits**:

- **Natural**: Plugins work with data they already have
- **Decoupled**: No need to track internal service IDs
- **Consistent**: Matches service upsert behavior
- **Robust**: Works even when services are created by different plugins

### Method 2: Service ID (Backward Compatibility)

Use when you already have the service ID:

```javascript
{
  service_id: "service_123456",  // Known service ID
  enrichment: { /* ... */ }
}
```

**Use Cases**:

- Migrating existing code
- When you already have service IDs from previous queries
- Updating enrichments in response to service events

## Error Handling

### Response Structure

All enrichment functions return detailed success/failure information:

```javascript
const result = await PenPal.API.Services.AddEnrichments(enrichment_updates);

// Check results
console.log(`✅ Successfully added: ${result.accepted.length}`);
console.log(`❌ Failed to add: ${result.rejected.length}`);

// Handle failures
if (result.rejected?.length > 0) {
  result.rejected.forEach((rejection) => {
    console.error(
      `Failed to enrich ${rejection.selector.host}:${rejection.selector.port}`
    );
    console.error(`Reason: ${rejection.error}`);
  });
}
```

### Common Error Scenarios

**Service Not Found**:

```javascript
{
  selector: { host: "192.168.1.100", port: 80, ip_protocol: "TCP", project_id: "proj_123" },
  error: "Service not found matching criteria"
}
```

- **Cause**: No service exists with the specified host/port/protocol in the project
- **Solution**: Verify the service was discovered by another plugin first

**Multiple Services Found**:

```javascript
{
  selector: { host: "192.168.1.100", port: 80, ip_protocol: "TCP", project_id: "proj_123" },
  error: "Multiple services found matching criteria"
}
```

- **Cause**: Data integrity issue (should not happen with proper service management)
- **Solution**: Check for duplicate service entries

**Missing Required Parameters**:

```javascript
{
  selector: { host: "192.168.1.100" },
  error: "Missing required parameters: port, ip_protocol, project_id"
}
```

- **Cause**: Incomplete service identification
- **Solution**: Provide all required fields

**Invalid Enrichment Data**:

```javascript
{
  selector: { host: "192.168.1.100", port: 80, ip_protocol: "TCP", project_id: "proj_123" },
  error: "Enrichment missing required field: plugin_name"
}
```

- **Cause**: Malformed enrichment object
- **Solution**: Ensure enrichment includes `plugin_name` field

### Error Handling Best Practices

```javascript
export const parseAndUpsertResults = async (
  project_id,
  services_data,
  output_data
) => {
  try {
    const results = parseToolOutput(output_data);

    const enrichment_updates = results.map((result) => ({
      host: result.host,
      port: result.port,
      ip_protocol: "TCP",
      project_id: project_id,
      enrichment: {
        plugin_name: "YourPlugin",
        // ... tool-specific data
      },
    }));

    const result = await PenPal.API.Services.AddEnrichments(enrichment_updates);

    // Log success
    console.log(
      `[YourPlugin] Successfully added ${
        result.accepted?.length || 0
      } enrichments`
    );

    // Handle partial failures gracefully
    if (result.rejected && result.rejected.length > 0) {
      console.log(
        `[YourPlugin] Some enrichments were rejected (services not found):`,
        result.rejected.map(
          (r) =>
            `${r.selector?.host || "unknown"}:${
              r.selector?.port || "unknown"
            } - ${r.error || "unknown error"}`
        )
      );
    }
  } catch (error) {
    console.error("[YourPlugin] Failed to parse and upsert results:", error);
    // Don't throw - let the scan complete even if enrichment fails
  }
};
```

## Migration Guide

### From Manual Service Matching

**Before** (Complex manual matching):

```javascript
export const parseAndUpsertResults = async (
  project_id,
  services_data,
  output_data
) => {
  const results = parseToolOutput(output_data);
  const service_updates = [];

  for (const result of results) {
    // Manual service matching
    const matching_service = services_data.find((service) => {
      const service_host = service.host_ip || service.host?.ip_address;
      return service_host === result.host && service.port === result.port;
    });

    if (matching_service) {
      // Manual enrichment array management
      const updated_enrichments = [
        ...(matching_service.enrichments || []),
        {
          plugin_name: "YourPlugin",
          url: result.url,
          status_code: result.status_code,
        },
      ];

      service_updates.push({
        id: matching_service.id,
        enrichments: updated_enrichments,
      });
    }
  }

  // Manual bulk update
  if (service_updates.length > 0) {
    await PenPal.API.Services.UpsertMany(service_updates);
  }
};
```

**After** (Simple enrichment API):

```javascript
export const parseAndUpsertResults = async (
  project_id,
  services_data,
  output_data
) => {
  const results = parseToolOutput(output_data);

  // Convert results to enrichment format
  const enrichment_updates = results.map((result) => ({
    host: result.host,
    port: result.port,
    ip_protocol: "TCP",
    project_id: project_id,
    enrichment: {
      plugin_name: "YourPlugin",
      url: result.url,
      status_code: result.status_code,
      // ... other tool-specific data
    },
  }));

  // Add enrichments using CoreAPI
  const result = await PenPal.API.Services.AddEnrichments(enrichment_updates);
  console.log(`Successfully added ${result.accepted.length} enrichments`);
};
```

### Migration Benefits

1. **Reduced Code Complexity**: Eliminated ~40 lines of matching logic
2. **Improved Data Safety**: Atomic operations prevent race conditions
3. **Better Error Handling**: Detailed rejection reasons and graceful failure handling
4. **Enhanced Maintainability**: No dependency on service data structure
5. **Consistent Architecture**: Matches existing service upsert patterns

## Best Practices

### 1. Always Include Required Fields

```javascript
// ✅ CORRECT: Include all required fields
{
  host: "192.168.1.100",
  port: 80,
  ip_protocol: "TCP",
  project_id: project_id,
  enrichment: {
    plugin_name: "YourPlugin",  // Required for GraphQL interface
    // ... your fields
  }
}

// ❌ INCORRECT: Missing required fields
{
  host: "192.168.1.100",
  enrichment: {
    // Missing: port, ip_protocol, project_id, plugin_name
  }
}
```

### 2. Handle Errors Gracefully

```javascript
// ✅ CORRECT: Graceful error handling
try {
  const result = await PenPal.API.Services.AddEnrichments(enrichment_updates);

  if (result.rejected?.length > 0) {
    console.log("Some enrichments failed - services may not exist yet");
    // Continue processing, don't fail the entire operation
  }
} catch (error) {
  console.error("Enrichment API error:", error);
  // Log but don't crash the plugin
}
```

### 3. Use Consistent Data Types

```javascript
// ✅ CORRECT: Consistent data types
{
  host: "192.168.1.100",        // String IP address
  port: 80,                     // Integer port number
  ip_protocol: "TCP",           // String protocol (uppercase)
  project_id: project_id,       // String project ID
}

// ❌ INCORRECT: Inconsistent types
{
  host: 192168001100,           // Number instead of string
  port: "80",                   // String instead of number
  ip_protocol: "tcp",           // Lowercase instead of uppercase
}
```

### 4. Validate Tool Output

```javascript
// ✅ CORRECT: Validate before enriching
const enrichment_updates = results
  .filter((result) => result.host && result.port) // Filter invalid results
  .map((result) => ({
    host: String(result.host), // Ensure string type
    port: parseInt(result.port), // Ensure integer type
    ip_protocol: "TCP",
    project_id: project_id,
    enrichment: {
      plugin_name: "YourPlugin",
      // ... validated fields
    },
  }));
```

### 5. Use Descriptive Logging

```javascript
// ✅ CORRECT: Informative logging
console.log(`[YourPlugin] Found ${results.length} tool results`);
console.log(
  `[YourPlugin] Created ${enrichment_updates.length} enrichment updates`
);

const result = await PenPal.API.Services.AddEnrichments(enrichment_updates);
console.log(
  `[YourPlugin] Successfully added ${result.accepted.length} enrichments`
);

if (result.rejected?.length > 0) {
  console.log(
    `[YourPlugin] ${result.rejected.length} enrichments rejected (services not found)`
  );
}
```

## Performance Considerations

### Bulk Operations

Always use bulk operations when possible:

```javascript
// ✅ EFFICIENT: Bulk enrichment
const result = await PenPal.API.Services.AddEnrichments(many_enrichments);

// ❌ INEFFICIENT: Individual enrichments
for (const enrichment of many_enrichments) {
  await PenPal.API.Services.AddEnrichment(enrichment);
}
```

### Event Batching

Use `BatchFunction` for high-frequency events:

```javascript
// ✅ EFFICIENT: Batched event processing
await MQTT.Subscribe(
  PenPal.API.MQTT.Topics.New.Services,
  PenPal.Utils.BatchFunction(processBatchedServices, 5000)
);
```

### Host Data Caching

Cache host lookups when processing multiple services:

```javascript
// ✅ EFFICIENT: Cache host data
const hosts_map = {};
for (const service of services) {
  if (service.host && !hosts_map[service.host]) {
    const host_data = await PenPal.API.Hosts.Get(service.host);
    hosts_map[service.host] = host_data;
    service.host_ip = host_data?.ip_address;
  } else if (hosts_map[service.host]) {
    service.host_ip = hosts_map[service.host].ip_address;
  }
}
```

## Troubleshooting

### Common Issues

**Issue**: "Service not found matching criteria"

- **Cause**: Service hasn't been discovered yet, or wrong project ID
- **Solution**: Verify service exists and project ID is correct

**Issue**: "Multiple services found matching criteria"

- **Cause**: Duplicate service entries in database
- **Solution**: Check data integrity, may need database cleanup

**Issue**: Enrichments not appearing in UI

- **Cause**: Missing `plugin_name` field or GraphQL resolver not registered
- **Solution**: Ensure enrichment includes `plugin_name` and plugin has proper GraphQL setup

**Issue**: Performance problems with large enrichment batches

- **Cause**: Too many enrichments processed at once
- **Solution**: Break into smaller batches (recommended: 100-500 per batch)

### Debug Logging

Enable debug logging to troubleshoot enrichment issues:

```javascript
console.log("[YourPlugin] Input data:", {
  project_id,
  services_count: services.length,
});
console.log("[YourPlugin] Tool results:", results.length);
console.log("[YourPlugin] Enrichment updates:", enrichment_updates);

const result = await PenPal.API.Services.AddEnrichments(enrichment_updates);
console.log("[YourPlugin] API result:", result);
```

## Related Documentation

- **Plugin System Guide**: [plugin-system.mdc](.cursor/rules/plugin-system.mdc)
- **CoreAPI Plugin**: [Plugins/CoreAPI/](../CoreAPI/)
- **Service Management**: [Plugins/CoreAPI/server/api/services.js](../CoreAPI/server/api/services.js)
- **GraphQL Schema**: [Plugins/CoreAPI/server/graphql/schema/](../CoreAPI/server/graphql/schema/)
- **Example Implementation**: [Plugins/HttpX/server/httpx.js](../HttpX/server/httpx.js)
