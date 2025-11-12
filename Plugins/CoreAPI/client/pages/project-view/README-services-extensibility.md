# Services UI Extensibility Guide

The PenPal services UI provides a **modular, plugin-agnostic** extensible system for plugins to contribute custom display components and capabilities for their enrichment data. CoreAPI never needs to know about specific plugins - plugins register themselves.

## Overview

The services UI consists of three main views:

1. **List View** - Shows all services with basic information
2. **Enrichments View** - Shows detailed enrichment data from plugins (supports both table and card views)
3. **Graph View** - Future visualization view

## Modular Registration System

The enrichment system uses three registries that plugins can register with:

1. **Enrichment Display Registry** - Custom components for table view
2. **Enrichment Capabilities Registry** - Declare capabilities like card view support
3. **Enrichment Card Renderer Registry** - Custom components for card view

All registration happens through `PenPal.API` functions - CoreAPI never needs to know about your plugin.

## How Plugin Enrichments Work

### Server-Side Enrichment

Plugins enrich services by adding data to the `enrichments` array on each service:

```javascript
const enrichment = {
  plugin_name: "YourPlugin",
  url: "http://example.com:80",
  status_code: 200,
  title: "Example Page",
  // ... other plugin-specific fields
};

// Add to service using CoreAPI enrichment API
await PenPal.API.Services.AddEnrichment({
  host: "192.168.1.100",
  port: 80,
  ip_protocol: "TCP",
  project_id: project_id,
  enrichment: enrichment,
});
```

### Client-Side Registration

Plugins register their UI components and capabilities in their `client/plugin.js`:

```javascript
// In your plugin's client/plugin.js
import PenPal from "@penpal/core";
import YourEnrichmentDisplay from "./components/your-enrichment-display.jsx";
import YourEnrichmentCard from "./components/your-enrichment-card.jsx";

const YourPlugin = {
  loadPlugin() {
    // 1. Register table view display component
    PenPal.API.registerEnrichmentDisplay(
      "YourPlugin",
      YourEnrichmentDisplay
    );

    // 2. Register capabilities (e.g., card view support)
    PenPal.API.registerEnrichmentCapabilities("YourPlugin", {
      supportsCardView: true, // Enable card view toggle for this plugin
      cardViewLabel: "Gallery", // Optional: custom label for card view toggle
    });

    // 3. Register custom card view renderer (optional)
    PenPal.API.registerEnrichmentCardRenderer(
      "YourPlugin",
      YourEnrichmentCard
    );

    return {};
  },
};
```

## Registration Functions

### `registerEnrichmentDisplay(pluginName, component)`

Registers a custom component for displaying enrichments in table view.

**Parameters:**
- `pluginName` (string) - Must match the `plugin_name` in your enrichment data
- `component` (React.Component) - Component that receives `{ enrichment }` as props

**Example:**
```javascript
PenPal.API.registerEnrichmentDisplay("YourPlugin", YourEnrichmentDisplay);
```

### `registerEnrichmentCapabilities(pluginName, capabilities)`

Registers capabilities for your enrichment type.

**Parameters:**
- `pluginName` (string) - Your plugin name
- `capabilities` (object) - Object with properties:
  - `supportsCardView` (boolean) - Whether this plugin supports card view
  - `cardViewLabel` (string, optional) - Custom label for card view toggle

**Example:**
```javascript
PenPal.API.registerEnrichmentCapabilities("YourPlugin", {
  supportsCardView: true,
  cardViewLabel: "Gallery View", // Optional
});
```

### `registerEnrichmentCardRenderer(pluginName, component)`

Registers a custom component for displaying enrichments in card view.

**Parameters:**
- `pluginName` (string) - Your plugin name
- `component` (React.Component) - Component that receives `{ service, enrichment }` as props

**Example:**
```javascript
PenPal.API.registerEnrichmentCardRenderer("YourPlugin", YourEnrichmentCard);
```

## Creating Custom Components

### Table View Display Component

Create a React component that receives enrichment data:

```javascript
// client/components/your-enrichment-display.jsx
import React from "react";
import { registerComponent, Components } from "@penpal/core";

const YourEnrichmentDisplay = ({ enrichment }) => {
  return (
    <div>
      <h4>Your Plugin Data</h4>
      <p>Custom Field: {enrichment.custom_field}</p>
      {/* Your custom UI here */}
    </div>
  );
};

registerComponent("YourEnrichmentDisplay", YourEnrichmentDisplay);
export default YourEnrichmentDisplay;
```

### Card View Renderer Component

Create a React component that receives both service and enrichment data:

```javascript
// client/components/your-enrichment-card.jsx
import React from "react";
import { registerComponent, Components } from "@penpal/core";

const { Card, CardHeader, CardContent, CardTitle, Badge } = Components;

const YourEnrichmentCard = ({ service, enrichment }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-mono">
          {service.host?.ip_address}:{service.port}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your custom card UI here */}
        {enrichment.screenshot_url && (
          <img
            src={enrichment.screenshot_url}
            alt="Screenshot"
            className="w-full rounded"
          />
        )}
        <div>{enrichment.custom_field}</div>
      </CardContent>
    </Card>
  );
};

registerComponent("YourEnrichmentCard", YourEnrichmentCard);
export default YourEnrichmentCard;
```

## Default Behavior

### Table View

If no custom display component is registered, the system uses `EnhancedEnrichmentDisplay`, which:
- Shows enrichment data using UI directives (automatic formatting)
- Provides a "Raw Data" toggle to view JSON
- Handles all enrichment types generically

### Card View

If `supportsCardView: true` is registered but no custom card renderer is provided, the system uses `DefaultEnrichmentCard`, which:
- Shows service information (host, port, protocol)
- Uses `EnhancedEnrichmentDisplay` for enrichment data
- Provides a basic card layout

## Complete Example: Gowitness Plugin

Here's how the Gowitness plugin would register its components:

```javascript
// Plugins/Gowitness/client/plugin.js
import PenPal from "@penpal/core";
import GowitnessEnrichmentDisplay from "./components/gowitness-enrichment-display.jsx";
import GowitnessEnrichmentCard from "./components/gowitness-enrichment-card.jsx";

const GowitnessPlugin = {
  loadPlugin() {
    // Register table view display
    PenPal.API.registerEnrichmentDisplay(
      "Gowitness",
      GowitnessEnrichmentDisplay
    );

    // Register card view support
    PenPal.API.registerEnrichmentCapabilities("Gowitness", {
      supportsCardView: true,
    });

    // Register custom card renderer with screenshot display
    PenPal.API.registerEnrichmentCardRenderer(
      "Gowitness",
      GowitnessEnrichmentCard
    );

    return {};
  },
};

export default GowitnessPlugin;
```

## Benefits of Modular System

1. **Plugin Independence**: CoreAPI never needs to know about specific plugins
2. **Easy Extension**: Plugins can add new capabilities without modifying CoreAPI
3. **Consistent API**: All plugins use the same registration functions
4. **Fallback Support**: Default components handle unregistered plugins gracefully
5. **Future-Proof**: New capabilities can be added without breaking existing plugins

## GraphQL Integration

### Server-Side Schema

Make sure your GraphQL schema includes your enrichment type:

```graphql
# In your plugin's schema
type YourPluginEnrichment implements PluginEnrichment {
  plugin_name: String!
  your_custom_field: String
  # ... other fields
}
```

### Client-Side Query

**✅ CoreAPI Query is Plugin-Agnostic**

The CoreAPI query (`get-services-information.js`) is now completely generic and doesn't need to know about specific plugins:

```graphql
enrichments {
  __typename
  plugin_name
  data  # Contains all plugin-specific fields as JSON
  files {
    id
    filename
    content_type
    size
    url
    uploaded_at
  }
}
```

**How It Works:**

1. **Generic Query**: CoreAPI only queries the `data` field, which contains all plugin-specific data as JSON
2. **Automatic Resolution**: GraphQL automatically sets `__typename` based on interface resolution
3. **UI Directive System**: The UI directive system uses `__typename` to look up UI configuration
4. **Data Flattening**: `EnhancedEnrichmentDisplay` flattens the `data` field so all fields are accessible

**Optional: Plugin-Specific Query Extensions**

If your plugin needs typed fields for type safety or specific GraphQL features, you can create your own query that extends the base query:

```graphql
# In your plugin's client queries
import { gql } from "@apollo/client";
import baseQuery from "@penpal/coreapi/queries/get-services-information";

export const GET_SERVICES_WITH_YOUR_PLUGIN = gql`
  ${baseQuery}
  
  # Extend enrichments with your typed fields
  fragment YourPluginEnrichmentFields on YourPluginEnrichment {
    your_custom_field
    another_field
  }
`;
```

However, this is **not required** - the generic `data` field works perfectly with the UI directive system!

## Best Practices

1. **Plugin Name Consistency**: Use the same plugin name in:
   - Server enrichment `plugin_name` field
   - Client registration functions
   - GraphQL type names

2. **Error Handling**: Handle missing or null enrichment fields gracefully

3. **Visual Design**: Follow Material-UI patterns for consistency

4. **Performance**: Keep display components lightweight for large service lists

5. **User Experience**: Provide meaningful labels and formatting for technical data

6. **Card View**: Only register card view support if your enrichment has visual content (screenshots, images, etc.)

7. **Registration Timing**: Register components in `loadPlugin()` to ensure they're available when the UI loads

## Migration from Hardcoded System

If you're migrating from the old hardcoded system:

1. **Remove hardcoded checks** - No more `pluginName === "Gowitness"` checks in CoreAPI
2. **Register capabilities** - Use `registerEnrichmentCapabilities()` instead
3. **Register card renderers** - Use `registerEnrichmentCardRenderer()` instead
4. **Update imports** - Import from `enrichment-registry.js` instead of inline functions

This modular system ensures that plugins remain independent and CoreAPI stays plugin-agnostic, making the codebase more maintainable and extensible.
