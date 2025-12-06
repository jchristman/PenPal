import React, { useState, useMemo, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
} = Components;

interface Vulnerability {
  id: string;
  severity: string;
  status: string;
  discoveredBy: string;
  title?: string;
  description?: string;
  cve?: string;
  cvss?: number;
  cveIds?: string[];
  cvssScore?: number;
  discoveredAt?: string;
  affectedHosts?: any[];
  affectedServices?: any[];
  references?: string[];
  publishedDate?: string;
  lastModifiedDate?: string;
}

const TablePaginationActions = ({
  count,
  page,
  rowsPerPage,
  onPageChange
}: {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: any, page: number) => void;
}) => {
  const handleFirstPageButtonClick = (event: any) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: any) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: any) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: any) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <div className="flex items-center space-x-2 ml-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        className="h-8 w-8 cursor-pointer"
      >
        <ChevronDoubleLeftIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleBackButtonClick}
        disabled={page === 0}
        className="h-8 w-8 cursor-pointer"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        className="h-8 w-8 cursor-pointer"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        className="h-8 w-8 cursor-pointer"
      >
        <ChevronDoubleRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

const SortableHeader = ({
  children,
  sortKey,
  currentSort,
  onSort,
  className = "",
}: {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; direction: string } | null;
  onSort: (sort: { key: string; direction: string }) => void;
  className?: string;
}) => {
  const isSorted = currentSort?.key === sortKey;
  const direction = isSorted ? currentSort.direction : null;

  const handleClick = () => {
    if (isSorted) {
      onSort({ key: sortKey, direction: direction === "asc" ? "desc" : "asc" });
    } else {
      onSort({ key: sortKey, direction: "asc" });
    }
  };

  return (
    <TableHead
      className={`cursor-pointer hover:bg-muted/50 select-none ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          {isSorted && direction === "asc" && (
            <ChevronUpIcon className="h-3 w-3" />
          )}
          {isSorted && direction === "desc" && (
            <ChevronDownIcon className="h-3 w-3" />
          )}
          {!isSorted && (
            <div className="h-3 w-3 opacity-30">
              <ChevronUpIcon className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
    </TableHead>
  );
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const variantMap = {
    CRITICAL: "destructive",
    HIGH: "destructive",
    MEDIUM: "default",
    LOW: "secondary",
    INFO: "outline",
  };

  const colorMap = {
    CRITICAL: "bg-red-100 text-red-700 border-red-300",
    HIGH: "bg-orange-100 text-orange-700 border-orange-300",
    MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-300",
    LOW: "bg-blue-100 text-blue-700 border-blue-300",
    INFO: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <Badge
      variant={variantMap[severity as keyof typeof variantMap] || "outline"}
      className={`text-xs font-semibold ${colorMap[severity as keyof typeof colorMap] || ""}`}
    >
      {severity}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap = {
    NEW: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-red-100 text-red-700",
    FALSE_POSITIVE: "bg-gray-100 text-gray-700",
    MITIGATED: "bg-green-100 text-green-700",
  };

  return (
    <Badge variant="outline" className={`text-xs ${colorMap[status as keyof typeof colorMap] || ""}`}>
      {status.replace("_", " ")}
    </Badge>
  );
};

const DiscoveredByBadge = ({ discoveredBy }: { discoveredBy: string }) => {
  const isNuclei = discoveredBy === "Nuclei";
  return (
    <Badge variant={isNuclei ? "default" : "outline"} className="text-xs">
      {discoveredBy}
      {isNuclei && (
        <span className="ml-1 text-[10px] opacity-75">(Auto)</span>
      )}
    </Badge>
  );
};

const ProjectViewVulnerabilitiesTable = ({
  vulnerabilities = [],
  project,
}: {
  vulnerabilities?: Vulnerability[];
  project?: any;
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState<{ key: string; direction: string }>({ key: "severity", direction: "desc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [discoveredByFilter, setDiscoveredByFilter] = useState("all");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchTerm, severityFilter, statusFilter, discoveredByFilter]);

  // Filter vulnerabilities
  const filteredVulnerabilities = useMemo(() => {
    let filtered = vulnerabilities;

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((v) => v.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    // Discovered by filter
    if (discoveredByFilter !== "all") {
      filtered = filtered.filter((v) => v.discoveredBy === discoveredByFilter);
    }

    // Search filter
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.title?.toLowerCase().includes(term) ||
          v.description?.toLowerCase().includes(term) ||
          v.cveIds?.some((cve: string) => cve.toLowerCase().includes(term)) ||
          v.affectedHosts?.some((h) =>
            h.ip_address?.toLowerCase().includes(term)
          ) ||
          v.discoveredBy?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [
    vulnerabilities,
    debouncedSearchTerm,
    severityFilter,
    statusFilter,
    discoveredByFilter,
  ]);

  // Sort vulnerabilities
  const sortedVulnerabilities = useMemo(() => {
    if (!sort.key) return filteredVulnerabilities;

    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };

    return [...filteredVulnerabilities].sort((a, b) => {
      let aVal, bVal;

      switch (sort.key) {
        case "severity":
          aVal = severityOrder[a.severity as keyof typeof severityOrder] ?? 99;
          bVal = severityOrder[b.severity as keyof typeof severityOrder] ?? 99;
          return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
        case "title":
          aVal = a.title || "";
          bVal = b.title || "";
          break;
        case "cvssScore":
          aVal = a.cvssScore || 0;
          bVal = b.cvssScore || 0;
          return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
        case "discoveredBy":
          aVal = a.discoveredBy || "";
          bVal = b.discoveredBy || "";
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        case "discoveredAt":
          aVal = new Date(a.discoveredAt || 0).getTime();
          bVal = new Date(b.discoveredAt || 0).getTime();
          return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
        default:
          return 0;
      }

      if ((sort.key as string) !== "cvssScore" && (sort.key as string) !== "discoveredAt") {
        const result = aVal.localeCompare(bVal);
        return sort.direction === "asc" ? result : -result;
      }

      return sort.direction === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [filteredVulnerabilities, sort]);

  // Paginate vulnerabilities
  const paginatedVulnerabilities = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedVulnerabilities.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedVulnerabilities, page, rowsPerPage]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalVulns = filteredVulnerabilities.length;
    const criticalHigh =
      (filteredVulnerabilities.filter((v) => v.severity === "CRITICAL")
        .length ||
        0) +
      (filteredVulnerabilities.filter((v) => v.severity === "HIGH").length ||
        0);
    const nucleiVulns = filteredVulnerabilities.filter(
      (v) => v.discoveredBy === "Nuclei"
    ).length;
    const withCVE = filteredVulnerabilities.filter(
      (v) => v.cveIds && v.cveIds.length > 0
    ).length;

    return {
      totalVulns,
      criticalHigh,
      nucleiVulns,
      withCVE,
    };
  }, [filteredVulnerabilities]);

  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get unique values for filters
  const uniqueSeverities = useMemo(() => {
    return [...new Set(vulnerabilities.map((v) => v.severity))].sort();
  }, [vulnerabilities]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(vulnerabilities.map((v) => v.status))].sort();
  }, [vulnerabilities]);

  const uniqueDiscoveredBy = useMemo(() => {
    return [...new Set(vulnerabilities.map((v) => v.discoveredBy))].sort();
  }, [vulnerabilities]);

  const formatAffectedHosts = (hosts: any[]) => {
    if (!hosts || hosts.length === 0) {
      return <span className="text-muted-foreground">—</span>;
    }
    if (hosts.length === 1) {
      return <span className="font-mono text-sm">{hosts[0].ip_address}</span>;
    }
    return (
      <div className="flex flex-col gap-1">
        <span className="font-mono text-sm">{hosts[0].ip_address}</span>
        <span className="text-xs text-muted-foreground">
          +{hosts.length - 1} more
        </span>
      </div>
    );
  };

  const formatCVEIds = (cveIds: string[]) => {
    if (!cveIds || cveIds.length === 0) {
      return <span className="text-muted-foreground">—</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {cveIds.slice(0, 2).map((cve: string) => (
          <a
            key={cve}
            href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            {cve}
            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
          </a>
        ))}
        {cveIds.length > 2 && (
          <span className="text-xs text-muted-foreground">
            +{cveIds.length - 2}
          </span>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vulnerabilities</CardTitle>
        <CardDescription>
          A list of all vulnerabilities discovered in this project.
        </CardDescription>
        <div className="flex flex-col gap-4 pt-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search vulnerabilities..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                Total:{" "}
                <span className="font-bold ml-1">{stats.totalVulns}</span>
              </Badge>
              <Badge variant="destructive">
                Critical/High:{" "}
                <span className="font-bold ml-1">{stats.criticalHigh}</span>
              </Badge>
              <Badge variant="default">
                Nuclei:{" "}
                <span className="font-bold ml-1">{stats.nucleiVulns}</span>
              </Badge>
              <Badge variant="outline">
                With CVE: <span className="font-bold ml-1">{stats.withCVE}</span>
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              className="border border-input rounded px-3 py-1 text-sm"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              {uniqueSeverities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="border border-input rounded px-3 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
              className="border border-input rounded px-3 py-1 text-sm"
              value={discoveredByFilter}
              onChange={(e) => setDiscoveredByFilter(e.target.value)}
            >
              <option value="all">All Sources</option>
              {uniqueDiscoveredBy.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <SortableHeader
                sortKey="severity"
                currentSort={sort}
                onSort={setSort}
              >
                Severity
              </SortableHeader>
              <SortableHeader
                sortKey="title"
                currentSort={sort}
                onSort={setSort}
              >
                Title
              </SortableHeader>
              <SortableHeader
                sortKey="cvssScore"
                currentSort={sort}
                onSort={setSort}
              >
                CVSS
              </SortableHeader>
              <SortableHeader
                sortKey="discoveredBy"
                currentSort={sort}
                onSort={setSort}
              >
                Discovered By
              </SortableHeader>
              <TableHead>Affected Hosts</TableHead>
              <TableHead>CVE IDs</TableHead>
              <SortableHeader
                sortKey="status"
                currentSort={sort}
                onSort={setSort}
              >
                Status
              </SortableHeader>
              <SortableHeader
                sortKey="discoveredAt"
                currentSort={sort}
                onSort={setSort}
              >
                Discovered
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVulnerabilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <span className="text-muted-foreground">
                    No vulnerabilities found matching the current filters.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              paginatedVulnerabilities.map((vuln, index) => (
                <TableRow
                  key={vuln.id || index}
                  className="hover:bg-muted/50"
                >
                  <TableCell>
                    <SeverityBadge severity={vuln.severity} />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <div className="font-medium text-sm">{vuln.title}</div>
                      {vuln.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {vuln.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {vuln.cvssScore ? (
                      <Badge variant="outline" className="text-xs">
                        {vuln.cvssScore.toFixed(1)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DiscoveredByBadge discoveredBy={vuln.discoveredBy} />
                  </TableCell>
                  <TableCell>{formatAffectedHosts(vuln.affectedHosts || [])}</TableCell>
                  <TableCell>{formatCVEIds(vuln.cveIds || [])}</TableCell>
                  <TableCell>
                    <StatusBadge status={vuln.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {vuln.discoveredAt
                      ? new Date(vuln.discoveredAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Rows per page:
              <select
                className="ml-2 border border-input rounded px-2 py-1"
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {page * rowsPerPage + 1}-
              {Math.min(
                (page + 1) * rowsPerPage,
                sortedVulnerabilities.length
              )}{" "}
              of {sortedVulnerabilities.length} vulnerabilities
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Page {page + 1} of{" "}
              {Math.ceil(sortedVulnerabilities.length / rowsPerPage) || 1}
            </div>
            <TablePaginationActions
              count={sortedVulnerabilities.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

registerComponent(
  "ProjectViewVulnerabilitiesTable",
  ProjectViewVulnerabilitiesTable
);

export default ProjectViewVulnerabilitiesTable;

