import React, { useState } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";
import PenPal from "@penpal/core";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

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

// Default enrichment display component for plugins without custom displays
const DefaultEnrichmentDisplay = ({ enrichment }) => {
  // Show all top-level properties except plugin_name
  const topLevelEntries = Object.entries(enrichment).filter(
    ([key]) => key !== "plugin_name"
  );

  // If there's a data field, also show its contents
  const dataEntries = enrichment.data ? Object.entries(enrichment.data) : [];

  return (
    <div className="space-y-2">
      {topLevelEntries.map(([key, value]) => (
        <div key={key} className="flex justify-between items-start">
          <span className="text-sm font-medium text-muted-foreground min-w-0 mr-4">
            {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
          </span>
          <span className="text-sm text-right break-all">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}

      {dataEntries.length > 0 && (
        <>
          <div className="text-xs text-primary font-medium mt-4 mb-2">
            Data Field Contents:
          </div>
          {dataEntries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground min-w-0 mr-4">
                {key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                :
              </span>
              <span className="text-sm text-right break-all">
                {Array.isArray(value) ? value.join(", ") : String(value)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

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
                {service.enrichments.map((enrichment, index) => {
                  const key = `${service.id}-${index}`;
                  const isOpen = openEnrichments.has(key);

                  // Use registered component or fallback to default
                  const DisplayComponent =
                    PenPal.API.EnrichmentDisplayRegistry?.get(
                      enrichment.plugin_name
                    ) || DefaultEnrichmentDisplay;

                  return (
                    <Collapsible
                      key={index}
                      open={isOpen}
                      onOpenChange={() => toggleEnrichment(service.id, index)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-4 h-auto bg-muted/10 hover:bg-muted/20"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {enrichment.plugin_name} Enrichment
                            </span>
                            <Badge variant="default" className="text-xs">
                              {enrichment.plugin_name}
                            </Badge>
                          </div>
                          <ChevronDownIcon
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isOpen && "transform rotate-180"
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 border-t bg-background">
                        <DisplayComponent enrichment={enrichment} />
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
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
