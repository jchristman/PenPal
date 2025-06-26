import React, { useState, useMemo } from "react";
import { Components, registerComponent } from "@penpal/core";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ServerIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
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
  Badge,
  Input,
} = Components;

const TablePaginationActions = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  isLoading,
}) => {
  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
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

const StatBadge = ({ icon: Icon, label, value, variant = "secondary" }) => (
  <div className="flex items-center space-x-1">
    <Icon className="h-3 w-3 text-muted-foreground" />
    <Badge variant={variant} className="text-xs px-1.5 py-0.5">
      {value}
    </Badge>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

const ServiceStatusBadge = ({ status }) => {
  const variant = status === "open" ? "default" : "secondary";
  const color = status === "open" ? "bg-green-100 text-green-700" : "";

  return (
    <Badge variant={variant} className={`text-xs ${color}`}>
      {status}
    </Badge>
  );
};

const ProtocolBadge = ({ protocol }) => {
  const color =
    protocol === "TCP"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";

  return <Badge className={`text-xs ${color}`}>{protocol}</Badge>;
};

const ProjectViewServicesTable = ({ services = [] }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState({ key: "port", direction: "asc" });

  // Filter services based on search term
  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;

    const term = searchTerm.toLowerCase();
    return services.filter(
      (service) =>
        service.host?.ip_address?.toLowerCase().includes(term) ||
        service.port?.toString().includes(term) ||
        service.name?.toLowerCase().includes(term) ||
        service.ip_protocol?.toLowerCase().includes(term) ||
        service.status?.toLowerCase().includes(term)
    );
  }, [services, searchTerm]);

  // Sort services
  const sortedServices = useMemo(() => {
    if (!sort.key) return filteredServices;

    return [...filteredServices].sort((a, b) => {
      let aVal, bVal;

      switch (sort.key) {
        case "host":
          aVal = a.host?.ip_address || "";
          bVal = b.host?.ip_address || "";
          // Proper IP address sorting
          if (aVal && bVal) {
            const aOctets = aVal.split(".").map(Number);
            const bOctets = bVal.split(".").map(Number);
            for (let i = 0; i < 4; i++) {
              if (aOctets[i] !== bOctets[i]) {
                return aOctets[i] - bOctets[i];
              }
            }
            return 0;
          }
          break;
        case "port":
          aVal = a.port || 0;
          bVal = b.port || 0;
          return aVal - bVal;
        case "name":
          aVal = a.name || "";
          bVal = b.name || "";
          break;
        case "protocol":
          aVal = a.ip_protocol || "";
          bVal = b.ip_protocol || "";
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        case "enrichments":
          aVal = a.enrichments?.length || 0;
          bVal = b.enrichments?.length || 0;
          return aVal - bVal;
        default:
          return 0;
      }

      if (sort.key !== "port" && sort.key !== "enrichments") {
        const result = aVal.localeCompare(bVal);
        return sort.direction === "asc" ? result : -result;
      }

      return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredServices, sort]);

  // Paginate services
  const paginatedServices = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedServices.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedServices, page, rowsPerPage]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalServices = filteredServices.length;
    const openServices = filteredServices.filter(
      (s) => s.status === "open"
    ).length;
    const enrichedServices = filteredServices.filter(
      (s) => s.enrichments?.length > 0
    ).length;
    const uniqueHosts = new Set(filteredServices.map((s) => s.host?.ip_address))
      .size;

    return {
      totalServices,
      openServices,
      enrichedServices,
      uniqueHosts,
    };
  }, [filteredServices]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatEnrichments = (enrichments) => {
    if (!enrichments || enrichments.length === 0) {
      return <span className="text-muted-foreground">None</span>;
    }

    const pluginCounts = enrichments.reduce((acc, e) => {
      acc[e.plugin_name] = (acc[e.plugin_name] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(pluginCounts).map(([plugin, count]) => (
          <Badge key={plugin} variant="outline" className="text-xs">
            {plugin} {count > 1 ? `(${count})` : ""}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Header with search and stats */}
        <div className="p-6 border-b">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Services Table</h3>
              <div className="relative w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <StatBadge
                icon={ServerIcon}
                label="Total"
                value={stats.totalServices}
                variant="secondary"
              />
              <StatBadge
                icon={ShieldCheckIcon}
                label="Open"
                value={stats.openServices}
                variant="default"
              />
              <StatBadge
                icon={GlobeAltIcon}
                label="Enriched"
                value={stats.enrichedServices}
                variant="outline"
              />
              <StatBadge
                icon={ComputerDesktopIcon}
                label="Hosts"
                value={stats.uniqueHosts}
                variant="outline"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader
                  sortKey="host"
                  currentSort={sort}
                  onSort={setSort}
                >
                  Host
                </SortableHeader>
                <SortableHeader
                  sortKey="port"
                  currentSort={sort}
                  onSort={setSort}
                >
                  Port
                </SortableHeader>
                <SortableHeader
                  sortKey="protocol"
                  currentSort={sort}
                  onSort={setSort}
                >
                  Protocol
                </SortableHeader>
                <SortableHeader
                  sortKey="name"
                  currentSort={sort}
                  onSort={setSort}
                >
                  Service
                </SortableHeader>
                <SortableHeader
                  sortKey="status"
                  currentSort={sort}
                  onSort={setSort}
                >
                  Status
                </SortableHeader>
                <SortableHeader
                  sortKey="enrichments"
                  currentSort={sort}
                  onSort={setSort}
                >
                  Enrichments
                </SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedServices.map((service, index) => (
                <TableRow
                  key={service.id || index}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="font-mono">
                    {service.host?.ip_address || "Unknown"}
                  </TableCell>
                  <TableCell className="font-mono">
                    {service.port || "—"}
                  </TableCell>
                  <TableCell>
                    <ProtocolBadge protocol={service.ip_protocol} />
                  </TableCell>
                  <TableCell>
                    {service.name || (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ServiceStatusBadge status={service.status} />
                  </TableCell>
                  <TableCell>
                    {formatEnrichments(service.enrichments)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Rows per page:
              </span>
              <select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {sortedServices.length === 0
                  ? "0 of 0"
                  : `${page * rowsPerPage + 1}-${Math.min(
                      (page + 1) * rowsPerPage,
                      sortedServices.length
                    )} of ${sortedServices.length}`}
              </span>

              <TablePaginationActions
                count={sortedServices.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

registerComponent("ProjectViewServicesTable", ProjectViewServicesTable);

export default ProjectViewServicesTable;
