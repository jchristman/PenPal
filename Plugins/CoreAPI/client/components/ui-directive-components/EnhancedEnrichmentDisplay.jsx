import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";

const { UIDirectiveRenderer, UIDirectiveJsonTree, Switch, Label } = Components;

const EnhancedEnrichmentDisplay = ({ enrichment }) => {
  const [showRaw, setShowRaw] = useState(false);

  // Don't render anything if there's no enrichment data
  if (!enrichment) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-end space-x-2 my-2">
        <Label htmlFor="raw-toggle">Raw Data</Label>
        <Switch
          id="raw-toggle"
          checked={showRaw}
          onCheckedChange={setShowRaw}
        />
      </div>

      {showRaw ? (
        <UIDirectiveJsonTree value={enrichment} />
      ) : (
        <UIDirectiveRenderer enrichment={enrichment} />
      )}
    </div>
  );
};

registerComponent("EnhancedEnrichmentDisplay", EnhancedEnrichmentDisplay);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default EnhancedEnrichmentDisplay;
