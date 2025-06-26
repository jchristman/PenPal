import React, { useState, useMemo } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ComputerDesktopIcon,
  ServerIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const { formatDate } = Utils;

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

const ProjectViewHostsTable = ({ hosts = [] }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState({ key: "ip_address", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");

  // Filter and sort hosts
  const filteredAndSortedHosts = useMemo(() => {
    let filtered = hosts;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = hosts.filter((host) => {
        return (
          host.ip_address?.toLowerCase().includes(search) ||
          host.hostnames?.some((name) => name.toLowerCase().includes(search)) ||
          host.os?.name?.toLowerCase().includes(search) ||
          host.mac_address?.toLowerCase().includes(search)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sort.key) {
        case "ip_address":
          // Parse IP for proper numeric sorting
          aValue = a.ip_address
            ?.split(".")
            .map((num) => parseInt(num))
            .join("");
          bValue = b.ip_address
            ?.split(".")
            .map((num) => parseInt(num))
            .join("");
          break;
        case "hostnames":
          aValue = a.hostnames?.[0] || "";
          bValue = b.hostnames?.[0] || "";
          break;
        case "os":
          aValue = a.os?.name || "Unknown";
          bValue = b.os?.name || "Unknown";
          break;
        case "services":
          aValue = a.servicesConnection?.totalCount || 0;
          bValue = b.servicesConnection?.totalCount || 0;
          break;
        case "mac_address":
          aValue = a.mac_address || "";
          bValue = b.mac_address || "";
          break;
        default:
          aValue = "";
          bValue = "";
      }

      if (sort.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [hosts, searchTerm, sort]);

  // Paginate
  const paginatedHosts = filteredAndSortedHosts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search hosts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {filteredAndSortedHosts.length} hosts
          </span>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader
                  sortKey="ip_address"
                  currentSort={sort}
                  onSort={setSort}
                >
                  IP Address
                </SortableHeader>
                <SortableHeader
                  sortKey="hostnames"
                  currentSort={sort}
                  onSort={setSort}
                >
                  Hostnames
                </SortableHeader>
                <SortableHeader
                  sortKey="os"
                  currentSort={sort}
                  onSort={setSort}
                >
                  Operating System
                </SortableHeader>
                <SortableHeader
                  sortKey="mac_address"
                  currentSort={sort}
                  onSort={setSort}
                >
                  MAC Address
                </SortableHeader>
                <SortableHeader
                  sortKey="services"
                  currentSort={sort}
                  onSort={setSort}
                  className="text-right"
                >
                  Services
                </SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHosts.map((host) => (
                <TableRow
                  key={host.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <ComputerDesktopIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{host.ip_address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {host.hostnames?.length > 0 ? (
                      <div className="space-y-1">
                        {host.hostnames.slice(0, 2).map((hostname, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-1"
                          >
                            <GlobeAltIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{hostname}</span>
                          </div>
                        ))}
                        {host.hostnames.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{host.hostnames.length - 2} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        No hostnames
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {host.os?.name ? (
                      <Badge variant="outline">{host.os.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Unknown
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {host.mac_address ? (
                      <span className="font-mono text-xs">
                        {host.mac_address}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Unknown
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <ServerIcon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">
                        {host.servicesConnection?.totalCount || 0}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={handleChangeRowsPerPage}
            className="border border-input bg-background px-2 py-1 text-sm rounded-md"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {page * rowsPerPage + 1}-
            {Math.min((page + 1) * rowsPerPage, filteredAndSortedHosts.length)}{" "}
            of {filteredAndSortedHosts.length}
          </span>
          <TablePaginationActions
            count={filteredAndSortedHosts.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
          />
        </div>
      </div>
    </div>
  );
};

registerComponent("ProjectViewHostsTable", ProjectViewHostsTable);

export default ProjectViewHostsTable;
