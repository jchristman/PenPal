import React, { useState, useMemo } from "react";
import { registerComponent, Components } from "@penpal/core";
import { ArrowUpDown } from "lucide-react";

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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Badge,
  Button,
} = Components;

const ProjectViewNetworksTable = ({ networks = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "subnet",
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
        network.subnet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (network.domain &&
          network.domain.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [networksWithServiceCount, searchTerm]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("subnet")}>
                  Subnet
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("domain")}>
                  Domain
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("hostCount")}
                >
                  Host Count
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("serviceCount")}
                >
                  Service Count
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
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
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {sortedData.length} networks.
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {[...Array(totalPages).keys()].map((page) => (
                <PaginationItem key={page + 1}>
                  <PaginationLink
                    href="#"
                    onClick={() => handlePageChange(page + 1)}
                    isActive={currentPage === page + 1}
                  >
                    {page + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
};

registerComponent("ProjectViewNetworksTable", ProjectViewNetworksTable);
export default ProjectViewNetworksTable;
