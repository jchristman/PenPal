import React, { useState, useMemo, useEffect } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
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
  CardDescription,
  CardHeader,
  CardTitle,
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

const ProjectViewDomainsTable = ({ domains = [] }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
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

  // Filter and sort domains
  const filteredAndSortedDomains = useMemo(() => {
    let filtered = domains;

    // Apply search filter
    if (debouncedSearchTerm) {
      const search = debouncedSearchTerm.toLowerCase();
      filtered = domains.filter((domain) => {
        return (
          domain.name?.toLowerCase().includes(search) ||
          domain.resolved_ips?.some((ip) => ip.toLowerCase().includes(search))
        );
      });
    }

    // Apply sorting
    const sortableItems = [...filtered];
    sortableItems.sort((a, b) => {
      let aValue, bValue;

      switch (sort.key) {
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          break;
        case "resolved_ips":
          aValue = a.resolved_ips?.length || 0;
          bValue = b.resolved_ips?.length || 0;
          break;
        case "status":
          aValue = (a.resolved_ips?.length || 0) > 0 ? 1 : 0;
          bValue = (b.resolved_ips?.length || 0) > 0 ? 1 : 0;
          break;
        default:
          aValue = "";
          bValue = "";
      }

      if (sort.key === "resolved_ips" || sort.key === "status") {
        // Numeric comparison for counts
        if (sort.direction === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      if (sort.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sortableItems;
  }, [domains, debouncedSearchTerm, sort]);

  // Paginate
  const paginatedDomains = filteredAndSortedDomains.slice(
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

  // Calculate statistics
  const totalIPs = useMemo(
    () =>
      domains.reduce(
        (sum, domain) => sum + (domain.resolved_ips?.length || 0),
        0
      ),
    [domains]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domains</CardTitle>
        <CardDescription>
          A list of all domains discovered in this project.
        </CardDescription>
        <div className="flex justify-between items-center pt-4">
          <Input
            placeholder="Search domains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Total Domains:{" "}
              <span className="font-bold ml-1">{domains.length}</span>
            </Badge>
            <Badge variant="outline">
              Total IPs:{" "}
              <span className="font-bold ml-1">{totalIPs}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <SortableHeader
                sortKey="name"
                currentSort={sort}
                onSort={setSort}
              >
                Domain Name
              </SortableHeader>
              <SortableHeader
                sortKey="status"
                currentSort={sort}
                onSort={setSort}
              >
                Status
              </SortableHeader>
              <SortableHeader
                sortKey="resolved_ips"
                currentSort={sort}
                onSort={setSort}
                className="text-right"
              >
                Resolved IPs
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDomains.map((domain) => (
              <TableRow
                key={domain.id}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{domain.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {domain.resolved_ips?.length > 0 ? (
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <Badge variant="outline" className="text-green-600">
                        Resolved
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <XCircleIcon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">No Resolution</Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <ServerIcon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {domain.resolved_ips?.length || 0}
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
              {Math.min(
                (page + 1) * rowsPerPage,
                filteredAndSortedDomains.length
              )}{" "}
              of {filteredAndSortedDomains.length} domains
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Page {page + 1} of{" "}
              {Math.ceil(filteredAndSortedDomains.length / rowsPerPage) || 1}
            </div>
            <TablePaginationActions
              count={filteredAndSortedDomains.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              isLoading={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

registerComponent("ProjectViewDomainsTable", ProjectViewDomainsTable);

export default ProjectViewDomainsTable;
