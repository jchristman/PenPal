import React, { useState } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";
import PenPal from "@penpal/core";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

// Import the new enhanced display
import EnhancedEnrichmentDisplay from "../../components/ui-directive-components/EnhancedEnrichmentDisplay";

const { cn } = Utils;
const {
  Card,
  CardHeader,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Badge,
  Button,
} = Components;

// Initialize the enrichment display registry on the PenPal object
if (!PenPal.API) {
  PenPal.API = {};
}
if (!PenPal.API.EnrichmentDisplayRegistry) {
  PenPal.API.EnrichmentDisplayRegistry = new Map();
}

// Function to register enrichment display components
const registerEnrichmentDisplay = (pluginName, component) => {
  if (!PenPal.API) {
    PenPal.API = {};
  }
  if (!PenPal.API.EnrichmentDisplayRegistry) {
    PenPal.API.EnrichmentDisplayRegistry = new Map();
  }

  PenPal.API.EnrichmentDisplayRegistry.set(pluginName, component);
};

// Make the registration function available on PenPal.API
PenPal.API.registerEnrichmentDisplay = registerEnrichmentDisplay;

const ProjectViewServicesEnrichments = ({ services }) => {
  const [openEnrichments, setOpenEnrichments] = useState(new Set());

  const toggleEnrichment = (serviceId, enrichmentIndex) => {
    const key = `${serviceId}-${enrichmentIndex}`;
    const newOpen = new Set(openEnrichments);
    if (newOpen.has(key)) {
      newOpen.delete(key);
    } else {
      newOpen.add(key);
    }
    setOpenEnrichments(newOpen);
  };

  return (
    <div className="space-y-4 p-4">
      {services.map((service) => (
        <Card key={service.id} className="w-full border mb-4">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {service.host?.ip_address}:{service.port}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {service.name} ({service.ip_protocol})
                </span>
                <Badge variant="outline">{service.status}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {service.enrichments && service.enrichments.length > 0 ? (
              <div className="divide-y">
                {service.enrichments.map((enrichment, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-center mb-2">
                      <span className="font-medium mr-2">
                        {enrichment.plugin_name} Enrichment
                      </span>
                      <Badge variant="default" className="text-xs">
                        {enrichment.plugin_name}
                      </Badge>
                    </div>
                    <EnhancedEnrichmentDisplay enrichment={enrichment} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No enrichments available for this service.
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

registerComponent(
  "ProjectViewServicesEnrichments",
  ProjectViewServicesEnrichments
);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewServicesEnrichments;
