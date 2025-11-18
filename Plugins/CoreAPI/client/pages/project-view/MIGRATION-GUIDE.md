# Migration Guide: Modular Enrichment Registration System

This guide helps existing plugins migrate from hardcoded CoreAPI checks to the new modular registration system.

## What Changed

### Before (Hardcoded)
CoreAPI had hardcoded checks for specific plugins:
- Hardcoded plugin name checks (`pluginName === "Gowitness"`)
- Hardcoded card view support logic
- Hardcoded card rendering with specific field checks
- **GraphQL query had plugin-specific fragments** (`... on GowitnessPluginEnrichment`)

### After (Modular)
Plugins now register themselves:
- Plugins declare their own capabilities
- Plugins provide their own renderers
- CoreAPI is completely plugin-agnostic
- **GraphQL query is generic** - only queries `data` field (plugin-agnostic)

## Migration Steps

### Step 1: Update Your Plugin's Client Plugin File

**Before:**
```javascript
// Plugins/YourPlugin/client/plugin.js
const YourPlugin = {
  loadPlugin() {
    // No registration needed - CoreAPI had hardcoded support
    return {};
  },
};
```

**After:**
```javascript
// Plugins/YourPlugin/client/plugin.js
import PenPal from "@penpal/core";
import YourEnrichmentDisplay from "./components/your-enrichment-display.jsx";
import YourEnrichmentCard from "./components/your-enrichment-card.jsx"; // If you want card view

const YourPlugin = {
  loadPlugin() {
    // Register table view display component
    PenPal.API.registerEnrichmentDisplay(
      "YourPlugin",
      YourEnrichmentDisplay
    );

    // If your plugin has visual content (screenshots, images, etc.)
    PenPal.API.registerEnrichmentCapabilities("YourPlugin", {
      supportsCardView: true,
    });

    // Register custom card renderer (optional - uses default if not provided)
    PenPal.API.registerEnrichmentCardRenderer(
      "YourPlugin",
      YourEnrichmentCard
    );

    return {};
  },
};

export default YourPlugin;
```

### Step 2: Create Display Components (If Needed)

If you don't already have custom display components, create them:

**Table View Component:**
```javascript
// Plugins/YourPlugin/client/components/your-enrichment-display.jsx
import React from "react";
import { registerComponent, Components } from "@penpal/core";

const YourEnrichmentDisplay = ({ enrichment }) => {
  // Your custom display logic here
  return (
    <div>
      {/* Your UI */}
    </div>
  );
};

registerComponent("YourEnrichmentDisplay", YourEnrichmentDisplay);
export default YourEnrichmentDisplay;
```

**Card View Component (Optional):**
```javascript
// Plugins/YourPlugin/client/components/your-enrichment-card.jsx
import React from "react";
import { registerComponent, Components } from "@penpal/core";

const { Card, CardHeader, CardContent, CardTitle } = Components;

const YourEnrichmentCard = ({ service, enrichment }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {service.host?.ip_address}:{service.port}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your custom card UI */}
      </CardContent>
    </Card>
  );
};

registerComponent("YourEnrichmentCard", YourEnrichmentCard);
export default YourEnrichmentCard;
```

### Step 3: Verify Registration

After migration, verify that:
1. Your plugin name matches exactly in:
   - Server enrichment `plugin_name` field
   - Client registration (`registerEnrichmentDisplay("YourPlugin", ...)`)
   - GraphQL type name (`YourPluginEnrichment`)

2. Card view appears when `supportsCardView: true` is registered

3. Custom components render correctly in both table and card views

## Examples

### Gowitness Plugin Migration

**Before:** CoreAPI had hardcoded check:
```javascript
// In CoreAPI (old code)
return (
  selectedEnrichmentType === "Gowitness" ||
  selectedEnrichmentType === "Eyeballer"
);
```

**After:** Gowitness registers itself:
```javascript
// Plugins/Gowitness/client/plugin.js
PenPal.API.registerEnrichmentCapabilities("Gowitness", {
  supportsCardView: true,
});
```

### Eyeballer Plugin Migration

**Before:** CoreAPI had hardcoded check for Eyeballer

**After:** Eyeballer registers itself:
```javascript
// Plugins/Eyeballer/client/plugin.js
PenPal.API.registerEnrichmentCapabilities("Eyeballer", {
  supportsCardView: true,
});
```

## GraphQL Query Changes

**Important**: The CoreAPI GraphQL query (`get-services-information.js`) has been updated to be plugin-agnostic. It no longer includes plugin-specific fragments.

**Before:**
```graphql
enrichments {
  __typename
  plugin_name
  data
  ... on GowitnessPluginEnrichment {
    url
    status_code
    screenshot_url
    # ... plugin-specific fields
  }
  ... on EyeballerPluginEnrichment {
    # ... plugin-specific fields
  }
}
```

**After:**
```graphql
enrichments {
  __typename
  plugin_name
  data  # All plugin-specific data is here as JSON
  files {
    id
    filename
    url
    # ... file attachment fields
  }
}
```

**Why This Works:**
- The `data` field contains all plugin-specific fields as JSON
- `EnhancedEnrichmentDisplay` flattens the `data` field automatically
- The UI directive system uses `__typename` to look up UI configuration
- No plugin-specific fragments needed!

**If You Need Typed Fields:**
If your plugin requires typed GraphQL fields for type safety, you can create your own query extension (see the main README), but this is **not required** - the generic `data` field works perfectly.

## Benefits After Migration

1. **Plugin Independence**: Your plugin is self-contained
2. **No CoreAPI Changes**: Adding new plugins doesn't require CoreAPI modifications
3. **Better Maintainability**: Each plugin manages its own UI registration
4. **Consistent API**: All plugins use the same registration pattern
5. **Generic GraphQL**: CoreAPI query doesn't need to know about your plugin

## Troubleshooting

### Card View Not Appearing

- Check that `supportsCardView: true` is registered
- Verify plugin name matches exactly (case-sensitive)
- Ensure registration happens in `loadPlugin()` before UI renders

### Custom Component Not Rendering

- Verify component is registered with correct plugin name
- Check that plugin name matches enrichment `plugin_name` field
- Ensure component is exported and registered with `registerComponent()`

### Default Display Used Instead of Custom

- Verify `registerEnrichmentDisplay()` is called with correct plugin name
- Check that component is imported correctly
- Ensure registration happens before services are rendered

## Need Help?

Refer to the main [Services Extensibility Guide](./README-services-extensibility.md) for complete documentation.

