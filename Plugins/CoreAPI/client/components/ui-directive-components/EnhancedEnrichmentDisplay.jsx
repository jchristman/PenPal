import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";

const EnhancedEnrichmentDisplay = ({ enrichment }) => {
  const [showRaw, setShowRaw] = useState(false);

  // Don't render anything if there's no enrichment data
  if (!enrichment) {
    return null;
  }

  // Flatten enrichment: spread data fields to top-level if present, with data fields taking precedence
  const { data: enrichmentData, ...rest } = enrichment;
  const flatEnrichment =
    enrichmentData && typeof enrichmentData === "object"
      ? { ...rest, ...enrichmentData }
      : enrichment;

  // DEBUG: Log enrichment flattening and service value
  // if (process.env.NODE_ENV !== "production") {
  //   console.log("[EnhancedEnrichmentDisplay] Original enrichment:", enrichment);
  //   console.log(
  //     "[EnhancedEnrichmentDisplay] Flattened enrichment:",
  //     flatEnrichment
  //   );
  //   console.log(
  //     "[EnhancedEnrichmentDisplay] Service value:",
  //     flatEnrichment.service
  //   );
  // }

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
