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
  ShieldExclamationIcon,
  XMarkIcon,
  FunnelIcon,
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
  Checkbox,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Label,
} = Components;

interface SortState {
  key: string | "subnet" | "domain" | "hosts" | "name" | "status" | "resolved_ips" | "ip_address";
  direction: "asc" | "desc";
}

interface Service {
  id: string;
  host: {
    ip_address: string;
  };
  port: number;
  name?: string;
  ip_protocol: string;
  status: string;
  enrichments?: any[];
  vulnerabilitiesConnection?: { totalCount: number };
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
  currentSort: SortState | null;
  onSort: (sort: SortState) => void;
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

const ServiceStatusBadge = ({ status }: { status: string }) => {
  const variant = status === "open" ? "default" : "secondary";
  const color = status === "open" ? "bg-green-100 text-green-700" : "";

  return (
    <Badge variant={variant} className={`text-xs ${color}`}>
      {status}
    </Badge>
  );
};

const ProtocolBadge = ({ protocol }: { protocol: string }) => {
  const color =
    protocol === "TCP"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";

  return <Badge className={`text-xs ${color}`}>{protocol}</Badge>;
};

const ProjectViewServicesTable = ({ services = [] }: { services?: Service[] }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState<SortState>({ key: "port", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedEnrichments, setSelectedEnrichments] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

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

  // Get all unique enrichment types
  const availableEnrichments = useMemo(() => {
    const enrichmentSet = new Set<string>();
    services.forEach((service: Service) => {
      service.enrichments?.forEach((enrichment: any) => {
        enrichmentSet.add(enrichment.plugin_name);
      });
    });
    return Array.from(enrichmentSet).sort();
  }, [services]);

  // Filter services based on search term and enrichment filters
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Apply search filter
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.host?.ip_address?.toLowerCase().includes(term) ||
          service.port?.toString().includes(term) ||
          service.name?.toLowerCase().includes(term) ||
          service.ip_protocol?.toLowerCase().includes(term) ||
          service.status?.toLowerCase().includes(term)
      );
    }

    // Apply enrichment filter (AND operation - service must have ALL selected enrichments)
    if (selectedEnrichments.length > 0) {
      filtered = filtered.filter((service) => {
        const serviceEnrichmentTypes = new Set(
          service.enrichments?.map((e) => e.plugin_name) || []
        );
        // Service must have all selected enrichment types
        return selectedEnrichments.every((enrichment) =>
          serviceEnrichmentTypes.has(enrichment)
        );
      });
    }

    return filtered;
  }, [services, debouncedSearchTerm, selectedEnrichments]);

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
        case "vulnerabilities":
          aVal = a.vulnerabilitiesConnection?.totalCount || 0;
          bVal = b.vulnerabilitiesConnection?.totalCount || 0;
          return aVal - bVal;
        default:
          return 0;
      }

      if ((sort.key as string) !== "port" && (sort.key as string) !== "enrichments" && (sort.key as string) !== "vulnerabilities") {
        const result = aVal.localeCompare(bVal);
        return sort.direction === "asc" ? result : -result;
      }

      return sort.direction === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
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
      (s) => (s.enrichments?.length ?? 0) > 0
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

  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatEnrichments = (enrichments: any[]) => {
    if (!enrichments || enrichments.length === 0) {
      return <span className="text-muted-foreground">None</span>;
    }

    const pluginCounts = enrichments.reduce((acc: Record<string, number>, e: any) => {
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

  const handleRowClick = (service: Service) => {
    setSelectedService(service);
    setShowDetailPanel(true);
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedService(null);
  };

  const handleEnrichmentFilterChange = (enrichmentType: string, checked: boolean) => {
    setSelectedEnrichments((prev: string[]) => {
      if (checked) {
        return [...prev, enrichmentType];
      } else {
        return prev.filter((e: string) => e !== enrichmentType);
      }
    });
    setPage(0); // Reset to first page when filter changes
  };

  return (
    <div className="relative">
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>
            A list of all services discovered in this project.
          </CardDescription>
          <div className="flex justify-between items-center pt-4 gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              {availableEnrichments.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <FunnelIcon className="h-4 w-4" />
                      Filter Enrichments
                      {selectedEnrichments.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {selectedEnrichments.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Filter by Enrichment Type
                      </Label>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {availableEnrichments.map((enrichmentType: string) => (
                          <label
                            key={enrichmentType}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedEnrichments.includes(
                                enrichmentType
                              )}
                              onCheckedChange={(checked: boolean) =>
                                handleEnrichmentFilterChange(
                                  enrichmentType,
                                  checked
                                )
                              }
                            />
                            <span className="text-sm">{enrichmentType}</span>
                          </label>
                        ))}
                      </div>
                      {selectedEnrichments.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setSelectedEnrichments([])}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
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
              <SortableHeader
                sortKey="vulnerabilities"
                currentSort={sort}
                onSort={setSort}
                className="text-right"
              >
                Vulnerabilities
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedServices.map((service, index) => (
              <TableRow
                key={service.id || index}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => handleRowClick(service)}
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
                <TableCell>{formatEnrichments(service.enrichments || [])}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <ShieldExclamationIcon className="h-4 w-4 text-muted-foreground" />
                    <Badge
                      variant={
                        (service.vulnerabilitiesConnection?.totalCount || 0) > 0
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {service.vulnerabilitiesConnection?.totalCount || 0}
                    </Badge>
                  </div>
                </TableCell>
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

      {/* Slide-in Detail Panel */}
      {showDetailPanel && selectedService && (
        <ServiceDetailPanel
          service={selectedService}
          onClose={handleCloseDetailPanel}
        />
      )}
    </div>
  );
};

// Service Detail Panel Component
const ServiceDetailPanel = ({ service, onClose }: { service: Service; onClose: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/50 transition-opacity duration-200"
        style={{ opacity: isVisible ? 0.5 : 0 }}
        onClick={onClose}
      />
      
      {/* Slide-in Panel */}
      <div 
        className="w-full max-w-2xl bg-white shadow-xl overflow-y-auto transition-transform duration-300 ease-out"
        style={{
          transform: isVisible ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-semibold">
              {service.host?.ip_address}:{service.port}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {service.name} ({service.ip_protocol})
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Service Info */}
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <ServiceStatusBadge status={service.status} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Protocol</Label>
                  <div className="mt-1">
                    <ProtocolBadge protocol={service.ip_protocol} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Host</Label>
                  <div className="mt-1 font-mono">{service.host?.ip_address}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Port</Label>
                  <div className="mt-1 font-mono">{service.port}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrichments */}
          <Card>
            <CardHeader>
              <CardTitle>
                Enrichments ({service.enrichments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {service.enrichments && service.enrichments.length > 0 ? (
                <div className="space-y-4">
                  {service.enrichments.map((enrichment: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Badge variant="default" className="mr-2">
                          {enrichment.plugin_name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Enrichment {index + 1}
                        </span>
                      </div>
                      <Components.EnhancedEnrichmentDisplay
                        enrichment={enrichment}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No enrichments available for this service.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

registerComponent("ProjectViewServicesTable", ProjectViewServicesTable);

export default ProjectViewServicesTable;
