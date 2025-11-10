import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";

const EnhancedEnrichmentDisplay = ({ enrichment }) => {
  const [showRaw, setShowRaw] = useState(false);

  // Don't render anything if there's no enrichment data
  if (!enrichment) {
    return null;
  }

  // Flatten enrichment: spread data fields to top-level if present
  // Typed fields (from GraphQL fragments) take precedence over data fields
  const { data: enrichmentData, __typename, plugin_name, ...rest } = enrichment;
  
  // Fallback: if __typename is missing, derive it from plugin_name
  // This handles cases where GraphQL interface resolution didn't set __typename
  const resolvedTypename = __typename || (plugin_name ? `${plugin_name}PluginEnrichment` : null);
  
  const flatEnrichment =
    enrichmentData && typeof enrichmentData === "object"
      ? { __typename: resolvedTypename, plugin_name, ...enrichmentData, ...rest }
      : { __typename: resolvedTypename, plugin_name, ...enrichment };

  // DEBUG: Log enrichment structure for troubleshooting
  if (process.env.NODE_ENV !== "production") {
    console.log("[EnhancedEnrichmentDisplay] Original enrichment:", enrichment);
    console.log("[EnhancedEnrichmentDisplay] __typename:", __typename);
    console.log("[EnhancedEnrichmentDisplay] plugin_name:", plugin_name);
    console.log("[EnhancedEnrichmentDisplay] Resolved __typename:", resolvedTypename);
  }

  return (
    <div>
      <div className="flex items-center justify-end space-x-2 my-2">
        <Components.Label htmlFor="raw-toggle">Raw Data</Components.Label>
        <Components.Switch
          id="raw-toggle"
          checked={showRaw}
          onCheckedChange={setShowRaw}
        />
      </div>

      {showRaw ? (
        <Components.UIDirectiveJsonTree value={enrichment} />
      ) : (
        <Components.UIDirectiveRenderer enrichment={flatEnrichment} />
      )}
    </div>
  );
};

registerComponent("EnhancedEnrichmentDisplay", EnhancedEnrichmentDisplay);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default EnhancedEnrichmentDisplay;
