import React, { useMemo } from "react";
import { Components, registerComponent } from "@penpal/core";
import {
  ServerIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ChartBarIcon,
  CpuChipIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const { Card, CardHeader, CardContent, CardTitle, Badge, Progress } =
  Components;

const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  color = "primary",
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </CardContent>
  </Card>
);

const ProjectViewServicesDashboard = ({ services = [] }) => {
  const stats = useMemo(() => {
    const totalServices = services.length;
    const openServices = services.filter((s) => s.status === "open").length;
    const tcpServices = services.filter((s) => s.ip_protocol === "TCP").length;
    const udpServices = services.filter((s) => s.ip_protocol === "UDP").length;

    // Enriched services analysis
    const enrichedServices = services.filter(
      (s) => s.enrichments?.length > 0
    ).length;
    const httpServices = services.filter((s) =>
      s.enrichments?.some((e) => e.plugin_name === "HttpX")
    ).length;
    const nmapEnriched = services.filter((s) =>
      s.enrichments?.some((e) => e.plugin_name === "Nmap")
    ).length;

    // Port distribution
    const portDistribution = services.reduce((acc, service) => {
      const port = service.port;
      if (port) {
        if (port <= 1023)
          acc["Well-known (1-1023)"] = (acc["Well-known (1-1023)"] || 0) + 1;
        else if (port <= 49151)
          acc["Registered (1024-49151)"] =
            (acc["Registered (1024-49151)"] || 0) + 1;
        else
          acc["Dynamic (49152-65535)"] =
            (acc["Dynamic (49152-65535)"] || 0) + 1;
      }
      return acc;
    }, {});

    // Top ports
    const topPorts = Object.entries(
      services.reduce((acc, service) => {
        if (service.port) {
          acc[service.port] = (acc[service.port] || 0) + 1;
        }
        return acc;
      }, {})
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // Service names distribution
    const serviceNames = services.reduce((acc, service) => {
      const name = service.name || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    // Plugin enrichment stats
    const pluginStats = services.reduce((acc, service) => {
      service.enrichments?.forEach((enrichment) => {
        const plugin = enrichment.plugin_name;
        acc[plugin] = (acc[plugin] || 0) + 1;
      });
      return acc;
    }, {});

    return {
      totalServices,
      openServices,
      tcpServices,
      udpServices,
      enrichedServices,
      httpServices,
      nmapEnriched,
      portDistribution,
      topPorts,
      serviceNames,
      pluginStats,
    };
  }, [services]);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Services"
          value={stats.totalServices}
          icon={ServerIcon}
          subtitle="Discovered services"
        />
        <StatCard
          title="Open Services"
          value={stats.openServices}
          icon={LockClosedIcon}
          subtitle={`${(
            (stats.openServices / stats.totalServices) * 100 || 0
          ).toFixed(1)}% accessible`}
        />
        <StatCard
          title="Enriched Services"
          value={stats.enrichedServices}
          icon={ShieldCheckIcon}
          subtitle={`${(
            (stats.enrichedServices / stats.totalServices) * 100 || 0
          ).toFixed(1)}% analyzed`}
        />
        <StatCard
          title="HTTP Services"
          value={stats.httpServices}
          icon={GlobeAltIcon}
          subtitle="Web services found"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Protocol Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">TCP</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {stats.tcpServices}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {(
                      (stats.tcpServices / stats.totalServices) * 100 || 0
                    ).toFixed(1)}
                    %
                  </Badge>
                </div>
              </div>
              <Progress
                value={(stats.tcpServices / stats.totalServices) * 100}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">UDP</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {stats.udpServices}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {(
                      (stats.udpServices / stats.totalServices) * 100 || 0
                    ).toFixed(1)}
                    %
                  </Badge>
                </div>
              </div>
              <Progress
                value={(stats.udpServices / stats.totalServices) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Port Range Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Port Range Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.portDistribution).map(([range, count]) => {
              const percentage = ((count / stats.totalServices) * 100).toFixed(
                1
              );
              return (
                <div key={range} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{range}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Ports */}
        <Card>
          <CardHeader>
            <CardTitle>Most Common Ports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topPorts.slice(0, 8).map(([port, count]) => (
                <div key={port} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CpuChipIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Port {port}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {count}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {((count / stats.totalServices) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Plugin Enrichment Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Enrichment Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.pluginStats).map(([plugin, count]) => {
              const percentage = ((count / stats.totalServices) * 100).toFixed(
                1
              );
              return (
                <div key={plugin} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{plugin}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Service Discovery Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Service Discovery Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.openServices}
              </div>
              <div className="text-sm text-muted-foreground">Open Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.tcpServices}
              </div>
              <div className="text-sm text-muted-foreground">TCP Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.udpServices}
              </div>
              <div className="text-sm text-muted-foreground">UDP Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.enrichedServices}
              </div>
              <div className="text-sm text-muted-foreground">Enriched</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

registerComponent("ProjectViewServicesDashboard", ProjectViewServicesDashboard);

export default ProjectViewServicesDashboard;
