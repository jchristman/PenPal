import React, { useState } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";

const { cn } = Utils;
const { Card, CardHeader, CardContent } = Components.Card;

const ProjectViewHostsList = ({ hosts }) => {
  console.log(hosts);
  return (
    <div className="flex flex-wrap gap-4">
      {hosts.map((host) => (
        <Card
          key={host.id}
          className="min-w-[calc(50%-0.5rem)] border border-border"
        >
          <CardHeader>
            <h3 className="text-lg font-semibold">{host.ip_address}</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Hostnames: </span>
                <span className="text-muted-foreground">
                  {host.hostnames?.join(", ") ?? "No hostnames available"}
                </span>
              </div>
              <div>
                <span className="font-medium">Services Count: </span>
                <span className="text-muted-foreground">
                  {host.servicesConnection.totalCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

registerComponent("ProjectViewHostsList", ProjectViewHostsList);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewHostsList;
