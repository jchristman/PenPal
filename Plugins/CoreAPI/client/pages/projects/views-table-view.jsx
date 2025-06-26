import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Components, registerComponent, Utils } from "@penpal/core";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  Bars3Icon,
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
        className="h-8 w-8"
      >
        <ChevronDoubleLeftIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleBackButtonClick}
        disabled={page === 0}
        className="h-8 w-8"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        className="h-8 w-8"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        className="h-8 w-8"
      >
        <ChevronDoubleRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

const ProjectsViewTableView = ({
  projects = [],
  pageSize,
  setPageSize,
  page,
  setPage,
}) => {
  const navigate = useNavigate();

  console.log(projects);

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

  return (
    <Card>
      <CardContent className="p-0">
        <Table className="w-full">
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleNavigate(project.id)}
              >
                <TableCell className="p-0 h-13">
                  <div className="p-4">
                    <div className="font-semibold text-lg mb-1">
                      {project.name}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Customer: {project.customer.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {project.description} - Start Date:{" "}
                        {project.dates.start ?? "None"}
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4">
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
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              {page * pageSize + 1}-
              {Math.min((page + 1) * pageSize, projects.length)} of{" "}
              {projects.length}
            </div>
            <TablePaginationActions
              count={projects.length}
              page={page}
              rowsPerPage={pageSize}
              onPageChange={handleChangePage}
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
