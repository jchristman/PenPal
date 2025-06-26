import React, { useMemo } from "react";
import { Components, registerComponent } from "@penpal/core";
import {
  ComputerDesktopIcon,
  GlobeAltIcon,
  ServerIcon,
  ChartBarIcon,
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

const ProjectViewHostsDashboard = ({ hosts = [] }) => {
  const stats = useMemo(() => {
    const totalHosts = hosts.length;
    const hostsWithNames = hosts.filter((h) => h.hostnames?.length > 0).length;
    const totalServices = hosts.reduce(
      (sum, host) => sum + (host.servicesConnection?.totalCount || 0),
      0
    );
    const avgServicesPerHost =
      totalHosts > 0 ? (totalServices / totalHosts).toFixed(1) : 0;

    // OS distribution
    const osDistribution = hosts.reduce((acc, host) => {
      const osName = host.os?.name || "Unknown";
      acc[osName] = (acc[osName] || 0) + 1;
      return acc;
    }, {});

    // Service count distribution
    const serviceDistribution = hosts.reduce((acc, host) => {
      const serviceCount = host.servicesConnection?.totalCount || 0;
      if (serviceCount === 0)
        acc["No Services"] = (acc["No Services"] || 0) + 1;
      else if (serviceCount <= 5)
        acc["1-5 Services"] = (acc["1-5 Services"] || 0) + 1;
      else if (serviceCount <= 20)
        acc["6-20 Services"] = (acc["6-20 Services"] || 0) + 1;
      else acc["20+ Services"] = (acc["20+ Services"] || 0) + 1;
      return acc;
    }, {});

    return {
      totalHosts,
      hostsWithNames,
      totalServices,
      avgServicesPerHost,
      osDistribution,
      serviceDistribution,
    };
  }, [hosts]);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Hosts"
          value={stats.totalHosts}
          icon={ComputerDesktopIcon}
          subtitle="Discovered hosts"
        />
        <StatCard
          title="With Hostnames"
          value={stats.hostsWithNames}
          icon={GlobeAltIcon}
          subtitle={`${(
            (stats.hostsWithNames / stats.totalHosts) * 100 || 0
          ).toFixed(1)}% of hosts`}
        />
        <StatCard
          title="Total Services"
          value={stats.totalServices}
          icon={ServerIcon}
          subtitle="Across all hosts"
        />
        <StatCard
          title="Avg Services/Host"
          value={stats.avgServicesPerHost}
          icon={ChartBarIcon}
          subtitle="Services per host"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OS Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Operating System Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.osDistribution).map(([os, count]) => {
              const percentage = ((count / stats.totalHosts) * 100).toFixed(1);
              return (
                <div key={os} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{os}</span>
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

        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Service Count Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.serviceDistribution).map(([range, count]) => {
              const percentage = ((count / stats.totalHosts) * 100).toFixed(1);
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

      {/* Recent Discovery Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Host Discovery Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.hostsWithNames}
              </div>
              <div className="text-sm text-muted-foreground">
                Resolved Hostnames
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalHosts - stats.hostsWithNames}
              </div>
              <div className="text-sm text-muted-foreground">IP-Only Hosts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalServices}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Services
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

registerComponent("ProjectViewHostsDashboard", ProjectViewHostsDashboard);

export default ProjectViewHostsDashboard;
