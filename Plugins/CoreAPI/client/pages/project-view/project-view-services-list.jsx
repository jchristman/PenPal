import React, { useState } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";

const { cn } = Utils;
const { Card, CardHeader, CardContent } = Components.Card;
const { Badge } = Components.Badge;

const StatusChip = ({ status }) => {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "default";
      case "closed":
        return "secondary";
      case "filtered":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Badge variant={getStatusVariant(status)} className="ml-2">
      {status}
    </Badge>
  );
};

const ProtocolChip = ({ protocol }) => {
  return (
    <Badge variant="outline" className="ml-1">
      {protocol}
    </Badge>
  );
};

const ProjectViewServicesList = ({ services }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {services.map((service) => (
        <Card key={service.id} className="min-w-0 border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {service.host?.ip_address}:{service.port}
              </h3>
              <div className="flex items-center">
                <StatusChip status={service.status} />
                <ProtocolChip protocol={service.ip_protocol} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service:</span>
                <span className="text-sm font-medium">
                  {service.name || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Protocol:</span>
                <span className="text-sm">{service.ip_protocol}</span>
              </div>
              {service.enrichments && service.enrichments.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    {service.enrichments.length} enrichment
                    {service.enrichments.length !== 1 ? "s" : ""} available
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

registerComponent("ProjectViewServicesList", ProjectViewServicesList);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewServicesList;
