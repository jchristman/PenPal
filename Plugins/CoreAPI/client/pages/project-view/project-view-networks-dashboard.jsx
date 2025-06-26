import React, { useMemo } from "react";
import { registerComponent, Components } from "@penpal/core";
import { Users, Globe, Server, NetworkIcon } from "lucide-react";

const { Card, CardContent, CardHeader, CardTitle } = Components;

const ProjectViewNetworksDashboard = ({ networks = [] }) => {
  const getTotalServices = (network) => {
    if (!network?.hostsConnection?.hosts) return 0;
    return network.hostsConnection.hosts.reduce(
      (acc, host) => acc + (host.servicesConnection?.totalCount || 0),
      0
    );
  };

  const stats = useMemo(() => {
    const totalHosts = networks.reduce(
      (sum, n) => sum + (n.hostsConnection?.totalCount || 0),
      0
    );
    const totalServices = networks.reduce(
      (sum, n) => sum + getTotalServices(n),
      0
    );
    const networksWithMostHosts = [...networks]
      .sort(
        (a, b) =>
          (b.hostsConnection?.totalCount || 0) -
          (a.hostsConnection?.totalCount || 0)
      )
      .slice(0, 5);

    return { totalHosts, totalServices, networksWithMostHosts };
  }, [networks]);

  if (networks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No network data available for dashboard.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Networks</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{networks.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hosts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalHosts}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalServices}</div>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Top 5 Networks by Host Count
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.networksWithMostHosts.map((network) => (
            <div
              key={network.id}
              className="flex items-center justify-between text-sm mb-2"
            >
              <div className="flex items-center">
                <NetworkIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{network.subnet}</span>
              </div>
              <span className="font-bold">
                {network.hostsConnection?.totalCount || 0}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

registerComponent("ProjectViewNetworksDashboard", ProjectViewNetworksDashboard);
export default ProjectViewNetworksDashboard;
