# CoreAPI File Attachments for Enrichments

This document describes the new file attachment functionality added to the CoreAPI plugin, which allows plugins to attach files (screenshots, certificates, logs, reports, etc.) to service enrichments.

## Overview

The file attachment system allows plugins to:

- Attach files to enrichments (screenshots, certificates, logs, reports, etc.)
- Organize files by type and category
- Store files in FileStore with project/plugin-specific buckets
- Generate download URLs for files
- Retrieve and filter files by type

## Dependencies

CoreAPI now depends on the FileStore plugin:

```json
{
  "name": "CoreAPI",
  "dependsOn": ["DataStore@0.1.0", "MQTT@0.1.0", "FileStore@0.1.0"]
}
```

## File Types and Categories

### File Types

- `SCREENSHOT` - Web page screenshots
- `IMAGE` - General images
- `PDF` - PDF documents
- `TEXT` - Text files
- `LOG` - Log files
- `JSON` - JSON data
- `XML` - XML data
- `HTML` - HTML files
- `CSV` - CSV data
- `CERTIFICATE` - SSL/TLS certificates
- `KEY` - Private keys
- `REPORT` - Security reports
- `OTHER` - Other file types

### Categories

- `EVIDENCE` - Screenshots, logs, reports
- `DOCUMENTATION` - PDFs, text files
- `DATA` - JSON, XML, CSV
- `SECURITY` - Certificates, keys
- `OTHER` - Other categories

## API Functions

### Core Functions

#### `attachFileToEnrichment(service_selector, plugin_name, file_data, file_metadata)`

Attach a file to a service enrichment.

```javascript
const result = await PenPal.API.Services.AttachFileToEnrichment(
  {
    host: "192.168.1.100",
    port: 80,
    ip_protocol: "TCP",
    project_id: "proj123",
  },
  "HttpX",
  {
    filename: "screenshot.png",
    buffer: screenshot_buffer,
    mimeType: "image/png",
  },
  {
    type: "SCREENSHOT",
    category: "EVIDENCE",
    description: "Web page screenshot",
    tags: ["httpx", "screenshot"],
  }
);
```

#### `getEnrichmentFiles(service_selector, plugin_name)`

Get all files attached to an enrichment.

```javascript
const result = await PenPal.API.Services.GetEnrichmentFiles(
  service_selector,
  "HttpX"
);
console.log(result.files); // Array of file attachments
```

#### `removeFileFromEnrichment(service_selector, plugin_name, file_id)`

Remove a file from an enrichment.

```javascript
const result = await PenPal.API.Services.RemoveFileFromEnrichment(
  service_selector,
  "HttpX",
  "file123"
);
```

#### `generateEnrichmentFileDownloadUrl(service_selector, plugin_name, file_id, expiry_seconds)`

Generate a download URL for a file.

```javascript
const result = await PenPal.API.Services.GenerateEnrichmentFileDownloadUrl(
  service_selector,
  "HttpX",
  "file123",
  3600 // 1 hour expiry
);
console.log(result.download_url);
```

### Helper Functions

#### Screenshot Helpers

```javascript
// Attach screenshot to HttpX enrichment
await PenPal.API.Services.AttachScreenshotToHttpXEnrichment(
  service_selector,
  screenshot_buffer,
  "screenshot.png",
  { description: "Web page screenshot" }
);

// Get all screenshots for an enrichment
const screenshots = await PenPal.API.Services.GetEnrichmentScreenshots(
  service_selector,
  "HttpX"
);
```

#### Certificate Helpers

```javascript
// Attach certificate
await PenPal.API.Services.AttachCertificateToEnrichment(
  service_selector,
  "SSLScan",
  certificate_buffer,
  "cert.pem"
);

// Get certificates
const certs = await PenPal.API.Services.GetEnrichmentCertificates(
  service_selector,
  "SSLScan"
);
```

#### Log Helpers

```javascript
// Attach log file
await PenPal.API.Services.AttachLogToEnrichment(
  service_selector,
  "Nmap",
  log_content,
  "scan.log"
);

// Get logs
const logs = await PenPal.API.Services.GetEnrichmentLogs(
  service_selector,
  "Nmap"
);
```

## GraphQL Integration

### Mutations

```graphql
mutation AttachFile(
  $serviceSelector: ServiceSelectorInput!
  $pluginName: String!
  $file: Upload!
  $metadata: FileAttachmentMetadataInput
) {
  attachFileToEnrichment(
    service_selector: $serviceSelector
    plugin_name: $pluginName
    file: $file
    metadata: $metadata
  ) {
    success
    file_attachment {
      id
      filename
      file_type
      size
      uploaded_at
    }
    error
  }
}

mutation RemoveFile(
  $serviceSelector: ServiceSelectorInput!
  $pluginName: String!
  $fileId: ID!
) {
  removeFileFromEnrichment(
    service_selector: $serviceSelector
    plugin_name: $pluginName
    file_id: $fileId
  ) {
    success
    error
  }
}
```

### Queries

```graphql
query GetFiles($serviceSelector: ServiceSelectorInput!, $pluginName: String!) {
  getEnrichmentFiles(
    service_selector: $serviceSelector
    plugin_name: $pluginName
  ) {
    files {
      id
      filename
      file_type
      category
      size
      uploaded_at
      metadata
    }
    error
  }
}

query GetDownloadUrl(
  $serviceSelector: ServiceSelectorInput!
  $pluginName: String!
  $fileId: ID!
) {
  generateEnrichmentFileDownloadUrl(
    service_selector: $serviceSelector
    plugin_name: $pluginName
    file_id: $fileId
  ) {
    success
    download_url
    error
  }
}
```

## Schema Changes

The `PluginEnrichment` interface now includes a `files` field:

```graphql
interface PluginEnrichment {
  plugin_name: String!
  data: JSON
  files: [EnrichmentFileAttachment]
}
```

## Usage in Plugins

### HttpX Example

```javascript
// In HttpX plugin
import PenPal from "#penpal/core";

export const enhanceWithScreenshots = async (
  project_id,
  services_data,
  httpx_results
) => {
  for (const result of httpx_results) {
    if (result.status_code === 200) {
      const service = services_data.find(
        (s) => s.host_ip === result.host && s.port === result.port
      );

      if (service) {
        // Capture screenshot (using containerized tool)
        const screenshot_buffer = await captureScreenshot(result.url);

        // Attach to enrichment
        await PenPal.API.Services.AttachScreenshotToHttpXEnrichment(
          {
            host: service.host_ip,
            port: service.port,
            ip_protocol: service.ip_protocol,
            project_id: service.project_id,
          },
          screenshot_buffer,
          `${result.host}-${result.port}-screenshot.png`,
          {
            description: `Screenshot of ${result.url}`,
            url: result.url,
          }
        );
      }
    }
  }
};
```

## File Storage Organization

Files are stored in FileStore with the following bucket structure:

- **Bucket naming**: `enrichment-files-{project_id}-{plugin_name}`
- **File naming**: Original filename with UUID prefix for uniqueness
- **Metadata**: Stored in enrichment record with file references

## Constants and Utilities

File attachment constants are available through:

```javascript
PenPal.API.FileAttachment.Type.SCREENSHOT;
PenPal.API.FileAttachment.Category.EVIDENCE;
PenPal.API.FileAttachment.DetectFileType(filename, mimeType);
PenPal.API.FileAttachment.GetFileCategory(fileType);
```

## Best Practices

1. **Use specific file types** - Choose the most appropriate file type (SCREENSHOT vs IMAGE)
2. **Add meaningful metadata** - Include descriptions, tags, and context
3. **Handle errors gracefully** - File operations can fail, always check results
4. **Use helper functions** - For common scenarios like screenshots
5. **Clean up files** - Remove unnecessary files to save storage
6. **Organize by project** - Files are automatically organized by project and plugin

## Error Handling

All file operations return results with success/error fields:

```javascript
const result = await PenPal.API.Services.AttachFileToEnrichment(...);
if (result.success) {
  console.log("File attached successfully:", result.file_attachment.id);
} else {
  console.error("Failed to attach file:", result.error);
}
```

## Performance Considerations

- Files are stored asynchronously in FileStore
- Large files may take time to upload/download
- Use presigned URLs for direct client downloads
- Consider file size limits and cleanup policies
- Batch operations when attaching multiple files
