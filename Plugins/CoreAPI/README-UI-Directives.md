# UI Directives for Service Enrichment

This document explains how to use GraphQL schema directives to automatically generate rich UI components for service enrichment data, eliminating the need for custom React components in most cases.

## Overview

The UI Directives system provides three main directives that allow plugins to annotate their GraphQL enrichment schemas with UI component information:

- **`@uiComponent`** - Annotates individual fields with specific UI component types
- **`@uiGroup`** - Groups related fields together in the UI
- **`@enrichmentDisplay`** - Configures the overall display layout for an enrichment type

---

## How It Works

The system follows a three-step process to translate schema annotations into a rendered user interface:

1.  **Server-Side Schema Parsing**: When the GraphQL server starts, it introspects all registered plugin schemas. It parses the `@uiComponent`, `@uiGroup`, and `@enrichmentDisplay` directives and caches the results.

2.  **Client-Side Querying**: The client-side UI fetches these cached annotations using the `getUIDirectives(typeName: String!)` GraphQL query. This query returns a JSON object containing all the UI configuration for a given enrichment type (e.g., `HttpXPluginEnrichment`).

3.  **Component Rendering**:
    - The `EnhancedEnrichmentDisplay` component serves as the main entry point. It retrieves the UI directives for the given enrichment.
    - It passes the enrichment data and the UI configuration to the `UIDirectiveRenderer`.
    - The `UIDirectiveRenderer` iterates through the enrichment's data fields. For each field, it finds the corresponding UI component type from the directives, looks up the actual React component in a `componentMap`, and renders it with the appropriate data and configuration.

This architecture decouples the data definition (GraphQL schema) from the presentation layer (React components), allowing for flexible and maintainable auto-generated UIs.

---

## Quick Start & Migration Guide

Migrating an existing plugin from a custom React component to the UI Directive system is straightforward.

### Step 1: Analyze Your Existing Component

Before writing any directives, examine your existing custom enrichment display component. Identify:

- How fields are grouped (e.g., in sections or cards).
- Which UI elements are used for specific data types (e.g., badges for tags, links for URLs, code blocks for text).
- The visual hierarchy and order of fields.

This analysis will directly inform how you apply the UI directives.

### Step 2: Annotate the GraphQL Schema

Update your plugin's enrichment schema (`<YourPlugin>/server/graphql/schema/your-enrichment.schema.graphql`) with the appropriate directives.

**Example: Migrating the Nmap Plugin**

- **Before (No Directives):**

  ```graphql
  type NmapPluginEnrichment implements PluginEnrichment {
    plugin_name: String!
    data: JSON
    service: String
    fingerprint: String
    product: String
    version: String
    extra_info: String
  }
  ```

- **After (With UI Directives):** The directives below replicate the structure of the old `NmapEnrichmentDisplay` component.
  ```graphql
  type NmapPluginEnrichment implements PluginEnrichment
    @uiGroup(name: "service_info", label: "Service Information", priority: 0)
    @uiGroup(
      name: "fingerprint_info"
      label: "Service Fingerprint"
      collapsible: true
      priority: 10
    )
    @uiGroup(
      name: "extra"
      label: "Additional Information"
      collapsible: true
      priority: 20
    )
    @enrichmentDisplay(layout: "card", title: "Nmap Service Analysis") {
    plugin_name: String!
    data: JSON
    files: [EnrichmentFileAttachment]
    service: String
      @uiComponent(
        type: BADGE
        config: { group: "service_info", priority: 1, color: "primary" }
      )
    fingerprint: String
      @uiComponent(
        type: CODE_BLOCK
        config: {
          group: "fingerprint_info"
          language: "text"
          maxHeight: "200px"
        }
      )
    product: String
      @uiComponent(
        type: BADGE
        config: { group: "service_info", priority: 2, color: "success" }
      )
    version: String
      @uiComponent(
        type: BADGE
        config: { group: "service_info", priority: 3, color: "info" }
      )
    extra_info: String @uiComponent(type: TEXT, config: { group: "extra" })
  }
  ```

### Step 3: Disable the Custom Component

Finally, disable the registration of your old custom component in your plugin's client-side entry point (`<YourPlugin>/client/plugin.js`). This allows the `EnhancedEnrichmentDisplay` to take over as the default renderer.

- **Before (Registration Enabled):**

  ```javascript
  // ... imports
  import NmapEnrichmentDisplay from "./components/nmap-enrichment-display.jsx";

  const NmapPlugin = {
    loadPlugin() {
      // This registration logic will be disabled
      const registerNmapDisplay = () => {
        /* ... registration logic ... */
      };
      if (!registerNmapDisplay()) {
        // ... retry logic ...
      }
      return {};
    },
  };

  export default NmapPlugin;
  ```

- **After (Registration Disabled):**

  ```javascript
  // ... imports
  import NmapEnrichmentDisplay from "./components/nmap-enrichment-display.jsx";

  const NmapPlugin = {
    loadPlugin() {
      // The custom NmapEnrichmentDisplay is now disabled.
      // The new generic UI system will be used instead, based on the
      // @uiComponent directives in the GraphQL schema.
      return {};
    },
  };

  export default NmapPlugin;
  ```

Once these three steps are complete, the system will automatically render the enrichment using the new directive-based configuration.

---

## Available UI Component Types

### Basic Components

#### `TEXT`

Basic text display with optional formatting.

```graphql
title: String @uiComponent(type: TEXT, config: { priority: 0 })
description: String @uiComponent(type: TEXT, config: { maxLength: 200 })
```

#### `BADGE`

Chip/badge display ideal for technology stacks, tags, and categories.

```graphql
tech: [String] @uiComponent(type: BADGE, config: { color: "primary" })
categories: [String] @uiComponent(type: BADGE, config: { color: "secondary", maxItems: 5 })
```

#### `URL_LINK`

Clickable URL with external link indicator.

```graphql
url: String @uiComponent(type: URL_LINK, description: "Service URL")
documentation: String @uiComponent(type: URL_LINK, config: { label: "Docs" })
```

### Status and Progress Components

#### `STATUS_INDICATOR`

Colored status indicator with predefined themes.

```graphql
status: String @uiComponent(type: STATUS_INDICATOR, config: { color: "success" })
health: String @uiComponent(type: STATUS_INDICATOR, config: { color: "warning" })
```

#### `PROGRESS_BAR`

Progress bar or gauge for numeric percentages and scores.

```graphql
score: Int @uiComponent(type: PROGRESS_BAR, config: { max: 100 })
response_time: Int @uiComponent(type: PROGRESS_BAR, config: { max: 5000, unit: "ms" })
```

#### `RATING`

Star rating or numeric score display.

```graphql
security_score: Float @uiComponent(type: RATING, config: { max: 5, style: "stars" })
confidence: Int @uiComponent(type: RATING, config: { max: 100, style: "numeric" })
```

### Data Display Components

#### `METRIC`

Formatted metric display with unit conversion.

```graphql
file_size: Int @uiComponent(type: METRIC, config: { unit: "bytes" })
duration: Int @uiComponent(type: METRIC, config: { unit: "duration" })
count: Int @uiComponent(type: METRIC, config: { unit: "items" })
```

#### `TIMESTAMP`

Date/time with relative time display.

```graphql
last_seen: String @uiComponent(type: TIMESTAMP, config: { format: "relative" })
created_at: String @uiComponent(type: TIMESTAMP, config: { format: "full" })
```

#### `LIST`

Formatted list display with optional truncation.

```graphql
vulnerabilities: [String] @uiComponent(type: LIST, config: { maxItems: 3, expandable: true })
ports: [Int] @uiComponent(type: LIST, config: { format: "comma-separated" })
```

### Advanced Components

#### `TABLE`

Table display for structured array data.

```graphql
headers: JSON @uiComponent(type: TABLE, config: { columns: ["name", "value", "type"] })
scan_results: [JSON] @uiComponent(type: TABLE)
```

#### `JSON_TREE`

Collapsible JSON tree viewer for complex objects.

```graphql
metadata: JSON @uiComponent(type: JSON_TREE, config: { collapsed: true })
config: JSON @uiComponent(type: JSON_TREE, config: { maxDepth: 3 })
```

#### `CODE_BLOCK`

Syntax-highlighted code display.

```graphql
response_body: String @uiComponent(type: CODE_BLOCK, config: { language: "json" })
certificate: String @uiComponent(type: CODE_BLOCK, config: { language: "text" })
```

#### `IMAGE`

Image display with zoom and preview capabilities.

```graphql
screenshot: String @uiComponent(type: IMAGE, config: { thumbnail: true })
diagram: String @uiComponent(type: IMAGE, config: { maxWidth: "400px" })
```

### Utility Components

#### `COPYABLE_TEXT`

Text display with copy-to-clipboard functionality.

```graphql
api_key: String @uiComponent(type: COPYABLE_TEXT, config: { maxLength: 100 })
certificate_hash: String @uiComponent(type: COPYABLE_TEXT, config: { showCopyButton: true })
```

#### `ALERT`

Alert/notification display for important information.

```graphql
security_warning: String @uiComponent(type: ALERT, config: { severity: "warning", title: "Security Notice" })
error_message: String @uiComponent(type: ALERT, config: { severity: "error", dismissible: true })
```

#### `KEY_VALUE`

Key-value pair display for structured data.

```graphql
headers: JSON @uiComponent(type: KEY_VALUE, config: { orientation: "vertical" })
metadata: JSON @uiComponent(type: KEY_VALUE, config: { maxItems: 5, expandable: true })
```

#### `COLLAPSIBLE`

Standalone collapsible section for any content.

```graphql
detailed_log: String @uiComponent(type: COLLAPSIBLE, config: { title: "Full Log", defaultOpen: false })
configuration: JSON @uiComponent(type: COLLAPSIBLE, config: { variant: "card", maxHeight: "400px" })
```

## Configuration Options

All UI components support a common set of configuration options:

### Appearance

```graphql
config: {
  color: "primary" | "secondary" | "success" | "warning" | "error" | "info"
  size: "small" | "medium" | "large"
  icon: "icon-name"
  className: "custom-css-class"
}
```

### Layout and Priority

```graphql
config: {
  priority: 0           # Lower numbers show first
  group: "group-name"   # Group related fields
  label: "Custom Label" # Override field name
  hideLabel: true       # Hide field label entirely
}
```

### Interactive Features

```graphql
config: {
  interactive: true     # Make component clickable
  tooltip: "Help text"  # Hover tooltip
  copyable: true        # Add copy-to-clipboard
  expandable: true      # Show "expand" for truncated content
}
```

### Data Formatting

```graphql
config: {
  format: "pattern"     # Custom format pattern
  unit: "bytes"         # Unit for metrics
  maxItems: 5           # Limit for lists/arrays
  maxLength: 100        # Character limit for text
}
```

### Component-Specific Configuration

#### COPYABLE_TEXT Configuration

```graphql
config: {
  maxLength: 200        # Maximum length before truncation
  showCopyButton: true  # Show/hide copy button
  truncate: true        # Enable text truncation
}
```

#### ALERT Configuration

```graphql
config: {
  severity: "warning"   # info, warning, error, success
  title: "Alert Title" # Optional alert title
  dismissible: false    # Allow user to dismiss
}
```

#### KEY_VALUE Configuration

```graphql
config: {
  orientation: "horizontal"  # horizontal, vertical
  spacing: "normal"         # compact, normal, loose
  maxItems: 10             # Maximum items before truncation
  expandable: true         # Allow expanding truncated items
  keyLabel: "Property"     # Label for keys (when single value)
  valueLabel: "Value"      # Label for values (when single value)
}
```

#### COLLAPSIBLE Configuration

```graphql
config: {
  title: "Section Title" # Header text for the collapsible
  defaultOpen: false     # Whether to start expanded
  variant: "default"     # default, card, minimal
  showIcon: true         # Show expand/collapse icon
  maxHeight: "300px"     # Maximum height when expanded
}
```

## UI Grouping

Group related fields together with `@uiGroup`:

```graphql
type MyEnrichment
  @uiGroup(name: "response", label: "HTTP Response", collapsible: true) {
  status_code: Int
    @uiComponent(type: STATUS_INDICATOR, config: { group: "response" })
  response_size: Int @uiComponent(type: METRIC, config: { group: "response" })
  response_time: Int
    @uiComponent(type: PROGRESS_BAR, config: { group: "response" })
}
```

Groups can be:

- **Collapsible**: Users can expand/collapse the group
- **Prioritized**: Control the order of group display
- **Labeled**: Custom display names for groups

## Enrichment Display Configuration

Configure the overall layout with `@enrichmentDisplay`:

```graphql
type MyEnrichment @enrichmentDisplay(
  layout: "card"           # card | list | table | compact
  showSummary: true        # Show summary view
  summaryFields: ["url", "status_code"]  # Fields in summary
  maxHeight: "400px"       # Max height before scroll
  title: "HTTP Analysis"   # Custom section title
) {
  # ... fields
}
```

---

## Advanced Example: Security Plugin with New Components

Here's a comprehensive example showing how to use the new utility components in a security scanning plugin:

```graphql
type SecurityScanEnrichment implements PluginEnrichment
  @uiGroup(name: "summary", label: "Scan Summary", priority: 0)
  @uiGroup(
    name: "vulnerabilities"
    label: "Vulnerabilities"
    collapsible: true
    priority: 10
  )
  @uiGroup(
    name: "configuration"
    label: "Configuration Details"
    collapsible: true
    priority: 20
  )
  @uiGroup(name: "raw_data", label: "Raw Data", collapsible: true, priority: 30)
  @enrichmentDisplay(layout: "card", title: "Security Analysis") {
  plugin_name: String!
  data: JSON
  files: [EnrichmentFileAttachment]

  # Summary information with alerts
  risk_level: String
    @uiComponent(
      type: ALERT
      config: {
        severity: "warning"
        title: "Risk Assessment"
        group: "summary"
        priority: 1
      }
    )

  scan_date: String
    @uiComponent(
      type: TIMESTAMP
      config: { format: "relative", group: "summary", priority: 2 }
    )

  # Copyable technical details
  scan_id: String
    @uiComponent(
      type: COPYABLE_TEXT
      config: { group: "summary", priority: 3, maxLength: 50, label: "Scan ID" }
    )

  target_hash: String
    @uiComponent(
      type: COPYABLE_TEXT
      config: {
        group: "summary"
        priority: 4
        showCopyButton: true
        label: "Target Hash"
      }
    )

  # Vulnerability details as key-value pairs
  vulnerability_summary: JSON
    @uiComponent(
      type: KEY_VALUE
      config: {
        group: "vulnerabilities"
        orientation: "vertical"
        maxItems: 8
        expandable: true
      }
    )

  cve_list: [String]
    @uiComponent(
      type: LIST
      config: {
        group: "vulnerabilities"
        maxItems: 5
        expandable: true
        itemComponent: { type: BADGE, config: { color: "error" } }
      }
    )

  # Configuration as collapsible sections
  scanner_config: JSON
    @uiComponent(
      type: COLLAPSIBLE
      config: {
        group: "configuration"
        title: "Scanner Configuration"
        variant: "card"
        defaultOpen: false
      }
    )

  environment_details: JSON
    @uiComponent(
      type: COLLAPSIBLE
      config: {
        group: "configuration"
        title: "Environment Details"
        variant: "minimal"
        maxHeight: "200px"
      }
    )

  # Raw output for technical users
  full_report: String
    @uiComponent(
      type: COLLAPSIBLE
      config: {
        group: "raw_data"
        title: "Complete Scan Output"
        variant: "default"
        maxHeight: "400px"
      }
    )
}
```

This example demonstrates:

- **Risk alerts** with appropriate severity levels
- **Copyable technical identifiers** for sharing and reference
- **Structured vulnerability data** with expandable lists
- **Collapsible configuration sections** to reduce visual clutter
- **Logical grouping** with proper priorities

## Best Practices

- **Use `description` for Tooltips**: Add a `description` to your `@uiComponent` directive to automatically provide users with a helpful tooltip for that field.
  ```graphql
  url: String @uiComponent(type: URL_LINK, description: "The discovered HTTP service URL")
  ```
- **Group Logically**: Use `@uiGroup` to organize related fields. This improves readability, especially for enrichments with many data points.
- **Prioritize Important Fields**: Use the `priority` configuration option to control the order of fields and groups. Lower numbers appear first.
- **Choose the Right Component**: Select components that best represent the data type (e.g., `BADGE` for keywords, `METRIC` for numbers, `TIMESTAMP` for dates).
- **Use Alerts Sparingly**: Reserve `ALERT` components for truly important information that needs immediate attention.
- **Make Technical Data Copyable**: Use `COPYABLE_TEXT` for hashes, IDs, and other technical data that users might need to copy.
- **Organize Complex Data**: Use `KEY_VALUE` for structured metadata and `COLLAPSIBLE` for detailed information that doesn't need to be visible by default.
- **Keep It Simple**: Start with basic components (`TEXT`, `BADGE`, `URL_LINK`). You can always add more complex components like `TABLE` or `JSON_TREE` later if needed.

---

## Troubleshooting

- **My custom component is still showing instead of the new UI.**

  - Ensure you have disabled the `registerEnrichmentDisplay` call in your plugin's `client/plugin.js` file. The system prioritizes explicitly registered components.

- **A field is not rendering with the correct component.**

  - Check the `type` in your `@uiComponent` directive. Make sure it matches one of the available component types exactly (e.g., `URL_LINK`, not `LINK`).
  - Verify the field name in the schema matches the data field name in the enrichment object.

- **My groups or fields are in the wrong order.**

  - Check the `priority` values in your `@uiComponent` and `@uiGroup` configurations. Remember that lower numbers are displayed first.

- **I'm seeing a "Cannot query field 'getUIDirectives'" error.**

  - Ensure the CoreAPI plugin is loaded and that your plugin lists it as a dependency in its `manifest.json`.

- **A component is not getting the right configuration.**
  - Check the `config` object in your `@uiComponent` directive. Ensure the property names are correct (e.g., `color`, `unit`, `maxItems`). Refer to the "Available UI Component Types" section for a list of valid configuration options for each component.

---

_This system is designed to reduce the need for custom React components while providing rich, interactive displays for enrichment data. For complex use cases not covered by the standard components, custom React components can still be registered using the existing enrichment display system._
