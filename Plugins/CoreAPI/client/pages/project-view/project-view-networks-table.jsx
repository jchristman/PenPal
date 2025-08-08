import React, { useState, useMemo, useEffect } from "react";
import { registerComponent, Components } from "@penpal/core";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const {
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
  Input,
  Badge,
  Button,
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
      // Toggle direction if already sorted by this column
      onSort({ key: sortKey, direction: direction === "asc" ? "desc" : "asc" });
    } else {
      // Default to ascending for new sort
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

const ProjectViewNetworksTable = ({ networks = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "subnet",
    direction: "asc",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const getTotalServices = (network) => {
    if (!network?.hostsConnection?.hosts) return 0;
    return network.hostsConnection.hosts.reduce(
      (acc, host) => acc + (host.servicesConnection?.totalCount || 0),
      0
    );
  };

  const networksWithServiceCount = useMemo(
    () =>
      networks.map((network) => ({
        ...network,
        serviceCount: getTotalServices(network),
        hostCount: network.hostsConnection?.totalCount || 0,
      })),
    [networks]
  );

  const filteredData = useMemo(() => {
    return networksWithServiceCount.filter(
      (network) =>
        network.subnet
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        (network.domain &&
          network.domain
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()))
    );
  }, [networksWithServiceCount, debouncedSearchTerm]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalHosts = useMemo(
    () =>
      networks.reduce(
        (sum, network) => sum + (network.hostsConnection?.totalCount || 0),
        0
      ),
    [networks]
  );
  const totalServices = useMemo(
    () => networksWithServiceCount.reduce((sum, n) => sum + n.serviceCount, 0),
    [networksWithServiceCount]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Networks</CardTitle>
        <CardDescription>
          A list of all networks discovered in this project.
        </CardDescription>
        <div className="flex justify-between items-center pt-4">
          <Input
            placeholder="Search networks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Total Networks:{" "}
              <span className="font-bold ml-1">{networks.length}</span>
            </Badge>
            <Badge variant="outline">
              Total Hosts: <span className="font-bold ml-1">{totalHosts}</span>
            </Badge>
            <Badge variant="outline">
              Total Services:{" "}
              <span className="font-bold ml-1">{totalServices}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <SortableHeader
                sortKey="subnet"
                currentSort={sortConfig}
                onSort={setSortConfig}
              >
                Subnet
              </SortableHeader>
              <SortableHeader
                sortKey="domain"
                currentSort={sortConfig}
                onSort={setSortConfig}
              >
                Domain
              </SortableHeader>
              <SortableHeader
                sortKey="hostCount"
                currentSort={sortConfig}
                onSort={setSortConfig}
              >
                Host Count
              </SortableHeader>
              <SortableHeader
                sortKey="serviceCount"
                currentSort={sortConfig}
                onSort={setSortConfig}
              >
                Service Count
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((network) => (
                <TableRow key={network.id}>
                  <TableCell className="font-medium">
                    {network.subnet}
                  </TableCell>
                  <TableCell>{network.domain || "N/A"}</TableCell>
                  <TableCell>{network.hostCount}</TableCell>
                  <TableCell>{network.serviceCount}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="4" className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Rows per page:
              <select
                className="ml-2 border border-input rounded px-2 py-1"
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {page * rowsPerPage + 1}-
              {Math.min((page + 1) * rowsPerPage, sortedData.length)} of{" "}
              {sortedData.length} networks
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Page {page + 1} of{" "}
              {Math.ceil(sortedData.length / rowsPerPage) || 1}
            </div>
            <TablePaginationActions
              count={sortedData.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              isLoading={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

registerComponent("ProjectViewNetworksTable", ProjectViewNetworksTable);
export default ProjectViewNetworksTable;
