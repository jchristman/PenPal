import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Components, registerComponent, Utils } from "@penpal/core";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  Bars3Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  ServerIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowPathIcon,
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

const StatBadge = ({ icon: Icon, label, value, variant = "secondary" }) => (
  <div className="flex items-center space-x-1">
    <Icon className="h-3 w-3 text-muted-foreground" />
    <Badge variant={variant} className="text-xs px-1.5 py-0.5">
      {value}
    </Badge>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

const ScopeHeader = () => (
  <div className="flex items-center justify-center space-x-2">
    <Badge className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-100">
      Networks
    </Badge>
    <Badge className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 hover:bg-green-100">
      Hosts
    </Badge>
    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
      Services
    </Badge>
  </div>
);

const ProjectsViewTableView = ({
  projects = [],
  pageSize,
  setPageSize,
  page,
  setPage,
  totalCount = 0,
  isLoading = false,
  sort,
  setSort,
}) => {
  const navigate = useNavigate();

  // Calculate total statistics for each project
  const enhancedProjects = useMemo(() => {
    return projects.map((project) => {
      const directHosts = project.scope?.hostsConnection?.totalCount || 0;
      const directServices =
        project.scope?.hostsConnection?.servicesConnection?.totalCount || 0;
      const networks = project.scope?.networksConnection?.totalCount || 0;
      const networkHosts =
        project.scope?.networksConnection?.hostsConnection?.totalCount || 0;
      const networkServices =
        project.scope?.networksConnection?.hostsConnection?.servicesConnection
          ?.totalCount || 0;

      const totalHosts = directHosts + networkHosts;
      const totalServices = directServices + networkServices;

      return {
        ...project,
        stats: {
          directHosts,
          directServices,
          networks,
          networkHosts,
          networkServices,
          totalHosts,
          totalServices,
        },
      };
    });
  }, [projects]);

  // Use enhanced projects directly since they're already sorted server-side
  const sortedProjects = enhancedProjects;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleNavigate = (project_id) => {
    navigate(`/projects/${project_id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate pagination display values
  const startIndex = page * pageSize + 1;
  const endIndex = Math.min((page + 1) * pageSize, totalCount);
  const isLastPage = page >= Math.ceil(totalCount / pageSize) - 1;

  return (
    <Card className="rounded-none">
      <CardContent className="p-0">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <SortableHeader
                sortKey="name"
                currentSort={sort}
                onSort={setSort}
                className="w-80"
              >
                Project Details
              </SortableHeader>
              <SortableHeader
                sortKey="customer"
                currentSort={sort}
                onSort={setSort}
                className="w-32"
              >
                Customer
              </SortableHeader>
              <SortableHeader
                sortKey="start"
                currentSort={sort}
                onSort={setSort}
                className="w-32"
              >
                Start Date
              </SortableHeader>
              <SortableHeader
                sortKey="end"
                currentSort={sort}
                onSort={setSort}
                className="w-32"
              >
                End Date
              </SortableHeader>
              <TableHead className="w-24">
                <div className="flex justify-center w-full">
                  <Badge className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-100">
                    Networks
                  </Badge>
                </div>
              </TableHead>
              <TableHead className="w-24">
                <div className="flex justify-center w-full">
                  <Badge className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 hover:bg-green-100">
                    Hosts
                  </Badge>
                </div>
              </TableHead>
              <TableHead className="w-24">
                <div className="flex justify-center w-full">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    Services
                  </Badge>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={
              isLoading ? "opacity-90 transition-opacity duration-300" : ""
            }
          >
            {sortedProjects.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer row-hover-gray"
                onClick={() => handleNavigate(project.id)}
              >
                <TableCell className="p-4">
                  <div className="space-y-2">
                    <div className="font-semibold text-base">
                      {project.name}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {project.description || "No description"}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="p-4">
                  <span className="text-sm font-medium">
                    {project.customer.name}
                  </span>
                </TableCell>

                <TableCell className="p-4">
                  <div className="text-sm">
                    {formatDate(project.dates.start)}
                  </div>
                </TableCell>

                <TableCell className="p-4">
                  <div className="text-sm">{formatDate(project.dates.end)}</div>
                </TableCell>

                <TableCell className="p-4 text-center">
                  <Badge className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {project.stats.networks}
                  </Badge>
                </TableCell>

                <TableCell className="p-4 text-center">
                  <Badge className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 hover:bg-green-100">
                    {project.stats.totalHosts}
                  </Badge>
                </TableCell>

                <TableCell className="p-4 text-center">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {project.stats.totalServices}
                  </Badge>
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
                value={pageSize}
                onChange={handleChangeRowsPerPage}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {startIndex}-{endIndex} of {totalCount} projects
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Page {page + 1} of {Math.ceil(totalCount / pageSize) || 1}
            </div>
            <TablePaginationActions
              count={totalCount}
              page={page}
              rowsPerPage={pageSize}
              onPageChange={handleChangePage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const Icon = <Bars3Icon className="h-4 w-4" />;
export const Name = "Table View";

registerComponent("ProjectsViewTableView", ProjectsViewTableView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectsViewTableView;
