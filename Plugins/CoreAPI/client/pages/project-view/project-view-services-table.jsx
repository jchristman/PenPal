import React, { useState, useMemo, useEffect } from "react";
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

const TablePaginationActions = ({ count, page, rowsPerPage, onPageChange }) => {
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
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState({ key: "port", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchTerm]);

  // Filter services based on search term
  const filteredServices = useMemo(() => {
    if (!debouncedSearchTerm) return services;

    const term = debouncedSearchTerm.toLowerCase();
    return services.filter(
      (service) =>
        service.host?.ip_address?.toLowerCase().includes(term) ||
        service.port?.toString().includes(term) ||
        service.name?.toLowerCase().includes(term) ||
        service.ip_protocol?.toLowerCase().includes(term) ||
        service.status?.toLowerCase().includes(term)
    );
  }, [services, debouncedSearchTerm]);

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
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>
          A list of all services discovered in this project.
        </CardDescription>
        <div className="flex justify-between items-center pt-4">
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Total:{" "}
              <span className="font-bold ml-1">{stats.totalServices}</span>
            </Badge>
            <Badge variant="outline">
              Open: <span className="font-bold ml-1">{stats.openServices}</span>
            </Badge>
            <Badge variant="outline">
              Enriched:{" "}
              <span className="font-bold ml-1">{stats.enrichedServices}</span>
            </Badge>
            <Badge variant="outline">
              Hosts: <span className="font-bold ml-1">{stats.uniqueHosts}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table className="w-full">
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
                Discovery Method
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
              <TableRow key={service.id || index} className="hover:bg-muted/50">
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
                <TableCell>{formatEnrichments(service.enrichments)}</TableCell>
              </TableRow>
            ))}
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
              {Math.min((page + 1) * rowsPerPage, sortedServices.length)} of{" "}
              {sortedServices.length} services
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Page {page + 1} of{" "}
              {Math.ceil(sortedServices.length / rowsPerPage) || 1}
            </div>
            <TablePaginationActions
              count={sortedServices.length}
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

registerComponent("ProjectViewServicesTable", ProjectViewServicesTable);

export default ProjectViewServicesTable;
