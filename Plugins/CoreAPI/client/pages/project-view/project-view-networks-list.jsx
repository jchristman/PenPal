import React from "react";
import { registerComponent, Components } from "@penpal/core";

const { Card, CardContent, CardHeader, CardTitle, Badge } = Components;

const ProjectViewNetworksList = ({ networks = [] }) => {
  // Helper function to calculate total services for a network
  const getTotalServices = (network) => {
    if (!network?.hostsConnection?.hosts) {
      return 0;
    }
    return network.hostsConnection.hosts.reduce((acc, host) => {
      return acc + (host.servicesConnection?.totalCount || 0);
    }, 0);
  };

  if (!networks || networks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No networks found in this project.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {networks.map((network) => (
        <Card key={network.id}>
          <CardHeader>
            <CardTitle className="text-lg">{network.subnet}</CardTitle>
            {network.domain && (
              <p className="text-sm text-muted-foreground">{network.domain}</p>
            )}
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Hosts</span>
              <Badge variant="secondary">
                {network.hostsConnection?.totalCount || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Services</span>
              <Badge variant="secondary">{getTotalServices(network)}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

registerComponent("ProjectViewNetworksList", ProjectViewNetworksList);
export default ProjectViewNetworksList;
