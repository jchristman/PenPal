import React, { useMemo } from "react";
import { Components, registerComponent } from "@penpal/core";
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const { Card, CardHeader, CardContent, CardTitle, Badge, Progress } =
  Components;

interface Vulnerability {
  severity: string;
  status?: string;
  discoveredBy?: string;
  cveIds?: string[];
  cvssScore?: number;
  affectedHosts?: any[];
  affectedServices?: any[];
}

const SeverityIcon = ({ severity }: { severity: string }) => {
  const iconMap = {
    CRITICAL: ShieldExclamationIcon,
    HIGH: ExclamationTriangleIcon,
    MEDIUM: InformationCircleIcon,
    LOW: InformationCircleIcon,
    INFO: InformationCircleIcon,
  };
  const Icon = iconMap[severity as keyof typeof iconMap] || InformationCircleIcon;
  return <Icon className="h-4 w-4" />;
};

const SeverityColor = (severity: string) => {
  const colorMap = {
    CRITICAL: "destructive",
    HIGH: "destructive",
    MEDIUM: "default",
    LOW: "secondary",
    INFO: "outline",
  };
  return colorMap[severity as keyof typeof colorMap] || "outline";
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  color = "primary",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  subtitle?: string;
  color?: string;
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

const ProjectViewVulnerabilitiesDashboard = ({ vulnerabilities = [] }: { vulnerabilities?: Vulnerability[] }) => {
  const stats = useMemo(() => {
    const totalVulns = vulnerabilities.length;

    // Severity breakdown
    const severityCounts = vulnerabilities.reduce((acc: Record<string, number>, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Status breakdown
    const statusCounts = vulnerabilities.reduce((acc: Record<string, number>, vuln) => {
      const status = vuln.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Discovered by breakdown (to identify Nuclei vulnerabilities)
    const discoveredByCounts = vulnerabilities.reduce((acc: Record<string, number>, vuln) => {
      const discoveredBy = vuln.discoveredBy || 'unknown';
      acc[discoveredBy] = (acc[discoveredBy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // CVE breakdown
    const cveCount = vulnerabilities.filter(
      (v) => v.cveIds && v.cveIds.length > 0
    ).length;

    // CVSS score distribution
    const cvssDistribution = {
      critical: vulnerabilities.filter((v) => (v.cvssScore ?? 0) >= 9.0).length,
      high: vulnerabilities.filter(
        (v) => (v.cvssScore ?? 0) >= 7.0 && (v.cvssScore ?? 0) < 9.0
      ).length,
      medium: vulnerabilities.filter(
        (v) => (v.cvssScore ?? 0) >= 4.0 && (v.cvssScore ?? 0) < 7.0
      ).length,
      low: vulnerabilities.filter(
        (v) => (v.cvssScore ?? 0) > 0 && (v.cvssScore ?? 0) < 4.0
      ).length,
      none: vulnerabilities.filter((v) => !v.cvssScore).length,
    };

    // Affected hosts/services counts
    const affectedHosts = new Set();
    const affectedServices = new Set();
    vulnerabilities.forEach((v) => {
      v.affectedHosts?.forEach((h: any) => affectedHosts.add(h.id));
      v.affectedServices?.forEach((s: any) => affectedServices.add(s.id));
    });

    return {
      totalVulns,
      severityCounts,
      statusCounts,
      discoveredByCounts,
      cveCount,
      cvssDistribution,
      affectedHostsCount: affectedHosts.size,
      affectedServicesCount: affectedServices.size,
    };
  }, [vulnerabilities]);

  return (
    <div className="space-y-6 p-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Vulnerabilities"
          value={stats.totalVulns}
          icon={ShieldExclamationIcon}
          subtitle="All discovered vulnerabilities"
        />
        <StatCard
          title="Critical/High"
          value={
            (stats.severityCounts.CRITICAL || 0) +
            (stats.severityCounts.HIGH || 0)
          }
          icon={ExclamationTriangleIcon}
          subtitle="High priority findings"
        />
        <StatCard
          title="With CVE IDs"
          value={stats.cveCount}
          icon={InformationCircleIcon}
          subtitle={`${((stats.cveCount / stats.totalVulns) * 100 || 0).toFixed(1)}% have CVEs`}
        />
        <StatCard
          title="Affected Hosts"
          value={stats.affectedHostsCount}
          icon={CheckCircleIcon}
          subtitle="Unique hosts with vulnerabilities"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].map((severity) => {
              const count = stats.severityCounts[severity] || 0;
              const percentage =
                stats.totalVulns > 0
                  ? ((count / stats.totalVulns) * 100).toFixed(1)
                  : 0;
              return (
                <div key={severity} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SeverityIcon severity={severity} />
                      <span className="text-sm font-medium">{severity}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                      <Badge variant={SeverityColor(severity)} className="text-xs">
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

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const percentage =
                stats.totalVulns > 0
                  ? ((count / stats.totalVulns) * 100).toFixed(1)
                  : 0;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {status.toLowerCase().replace("_", " ")}
                    </span>
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
        {/* Discovered By Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Discovered By</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.discoveredByCounts).map(([plugin, count]) => {
              const percentage =
                stats.totalVulns > 0
                  ? ((count / stats.totalVulns) * 100).toFixed(1)
                  : 0;
              const isNuclei = plugin === "Nuclei";
              return (
                <div key={plugin} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{plugin}</span>
                      {isNuclei && (
                        <Badge variant="default" className="text-xs">
                          Automated
                        </Badge>
                      )}
                    </div>
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

        {/* CVSS Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>CVSS Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.cvssDistribution).map(([range, count]) => {
              const percentage =
                stats.totalVulns > 0
                  ? ((count / stats.totalVulns) * 100).toFixed(1)
                  : 0;
              const rangeLabels = {
                critical: "Critical (9.0-10.0)",
                high: "High (7.0-8.9)",
                medium: "Medium (4.0-6.9)",
                low: "Low (0.1-3.9)",
                none: "No Score",
              };
              return (
                <div key={range} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {rangeLabels[range as keyof typeof rangeLabels]}
                    </span>
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

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Vulnerability Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.severityCounts.CRITICAL || 0}
              </div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.severityCounts.HIGH || 0}
              </div>
              <div className="text-sm text-muted-foreground">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.severityCounts.MEDIUM || 0}
              </div>
              <div className="text-sm text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.affectedHostsCount}
              </div>
              <div className="text-sm text-muted-foreground">Affected Hosts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

registerComponent(
  "ProjectViewVulnerabilitiesDashboard",
  ProjectViewVulnerabilitiesDashboard
);

export default ProjectViewVulnerabilitiesDashboard;

