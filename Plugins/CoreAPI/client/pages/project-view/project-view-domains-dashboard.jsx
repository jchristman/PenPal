import React, { useMemo } from "react";
import { Components, registerComponent } from "@penpal/core";
import {
  GlobeAltIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const { Card, CardHeader, CardContent, CardTitle, Badge } = Components;

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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-2 rounded-md shadow-lg">
        <p className="label">{`${payload[0].name} : ${payload[0].value}`}</p>
        <p className="desc">{`(${(payload[0].percent * 100).toFixed(2)}%)`}</p>
      </div>
    );
  }
  return null;
};

const ProjectViewDomainsDashboard = ({ domains = [] }) => {
  const stats = useMemo(() => {
    const totalDomains = domains.length;
    const resolvedDomains = domains.filter((d) => d.resolved_ips?.length > 0).length;
    const totalIPs = domains.reduce(
      (sum, domain) => sum + (domain.resolved_ips?.length || 0),
      0
    );
    const avgIPsPerDomain =
      totalDomains > 0 ? (totalIPs / totalDomains).toFixed(1) : 0;

    // Resolution status distribution
    const resolutionDistribution = domains.reduce((acc, domain) => {
      const ipCount = domain.resolved_ips?.length || 0;
      if (ipCount === 0) acc["No Resolution"] = (acc["No Resolution"] || 0) + 1;
      else if (ipCount === 1) acc["Single IP"] = (acc["Single IP"] || 0) + 1;
      else if (ipCount <= 5) acc["2-5 IPs"] = (acc["2-5 IPs"] || 0) + 1;
      else acc["6+ IPs"] = (acc["6+ IPs"] || 0) + 1;
      return acc;
    }, {});
    const resolutionChartData = Object.entries(resolutionDistribution).map(
      ([name, value]) => ({ name, value })
    );

    // Top-level domain distribution
    const tldDistribution = domains.reduce((acc, domain) => {
      const parts = domain.name?.split('.') || [];
      const tld = parts.length >= 2 ? `.${parts[parts.length - 1]}` : 'Unknown';
      acc[tld] = (acc[tld] || 0) + 1;
      return acc;
    }, {});
    const tldChartData = Object.entries(tldDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 TLDs
      .map(([name, value]) => ({ name, value }));

    return {
      totalDomains,
      resolvedDomains,
      totalIPs,
      avgIPsPerDomain,
      resolutionDistribution,
      tldDistribution,
      resolutionChartData,
      tldChartData,
    };
  }, [domains]);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Domains"
          value={stats.totalDomains}
          icon={GlobeAltIcon}
          subtitle="Discovered domains"
        />
        <StatCard
          title="Resolved Domains"
          value={stats.resolvedDomains}
          icon={CheckCircleIcon}
          subtitle={`${(
            (stats.resolvedDomains / stats.totalDomains) * 100 || 0
          ).toFixed(1)}% resolved`}
        />
        <StatCard
          title="Total IP Addresses"
          value={stats.totalIPs}
          icon={ServerIcon}
          subtitle="Across all domains"
        />
        <StatCard
          title="Avg IPs/Domain"
          value={stats.avgIPsPerDomain}
          icon={XCircleIcon}
          subtitle="IPs per domain"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Domain Resolution Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.resolutionChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {stats.resolutionChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top-Level Domain Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top-Level Domain Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.tldChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {stats.tldChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Domain Discovery Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Discovery Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.resolvedDomains}
              </div>
              <div className="text-sm text-muted-foreground">
                Domains with IP Resolution
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalDomains - stats.resolvedDomains}
              </div>
              <div className="text-sm text-muted-foreground">
                Domains without Resolution
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalIPs}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Resolved IPs
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

registerComponent("ProjectViewDomainsDashboard", ProjectViewDomainsDashboard);

export default ProjectViewDomainsDashboard;
