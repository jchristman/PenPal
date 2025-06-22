import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Components, registerComponent } from "@penpal/core";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import ViewListIcon from "@mui/icons-material/ViewList";
import { makeStyles, useTheme } from "@mui/styles";

const useStyles1 = makeStyles((theme) => ({
  root: {
    flexShrink: 0,
    marginLeft: theme.spacing(2.5),
  },
}));

const TablePaginationActions = ({ count, page, rowsPerPage, onPageChange }) => {
  const classes = useStyles1();

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
    <div className={classes.root}>
      <IconButton onClick={handleFirstPageButtonClick} disabled={page === 0}>
        <FirstPageIcon />
      </IconButton>
      <IconButton onClick={handleBackButtonClick} disabled={page === 0}>
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
      >
        <LastPageIcon />
      </IconButton>
    </div>
  );
};

const useStyles2 = makeStyles((theme) => ({
  table: {
    minWidth: 500,
  },
  clickable: {
    cursor: "pointer",
  },
  statContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: theme.spacing(1.5),
    marginLeft: theme.spacing(1.5),
  },
  statTitle: {},
  statTopBottom: {
    display: "flex",
    flexDirection: "column",
  },
  statTop: {},
  summaryContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginRight: theme.spacing(1.5),
    marginLeft: theme.spacing(1.5),
  },
  summaryTitle: {
    width: 130,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: theme.spacing(2),
  },
  summaryTopBottom: {
    display: "flex",
    flexDirection: "column",
  },
  summaryTop: {},
}));

const ProjectsViewTableView = ({
  page,
  setPage,
  pageSize,
  setPageSize,
  pageSizeOptions,
  projectSummaries: { projects, totalCount },
}) => {
  const classes = useStyles2();
  const navigate = useNavigate();

  const emptyRows = pageSize - Math.min(pageSize, projects.length);

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
    <TableContainer component={Paper}>
      <Table className={classes.table}>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              hover
              className={classes.clickable}
              key={project.id}
              onClick={() => handleNavigate(project.id)}
            >
              <TableCell
                component="th"
                scope="row"
                style={{ padding: 0, height: 52 }}
              >
                <div className={classes.summaryContainer}>
                  <div className={classes.summaryTitle}>{project.name}</div>
                  <div className={classes.summaryTopBottom}>
                    <div className={classes.summaryTop}>
                      Customer: {project.customer.name}
                    </div>
                    <div className={classes.summaryBottom}>
                      {project.description} - Start Date:{" "}
                      {project.dates.start ?? "None"}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell style={{ width: 200, padding: 0 }} align="right">
                <div className={classes.statContainer}>
                  <div className={classes.statTitle}>Public Hosts</div>
                  <div className={classes.statTopBottom}>
                    <div className={classes.statTop}>
                      {project.scope.hostsConnection.totalCount} Hosts
                    </div>
                    <div className={classes.statBottom}>
                      {
                        project.scope.hostsConnection.servicesConnection
                          .totalCount
                      }{" "}
                      Services
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell style={{ width: 200, padding: 0 }} align="right">
                <div className={classes.statContainer}>
                  <div className={classes.statTitle}>
                    {project.scope.networksConnection.totalCount} Networks
                  </div>
                  <div className={classes.statTopBottom}>
                    <div className={classes.statTop}>
                      {
                        project.scope.networksConnection.hostsConnection
                          .totalCount
                      }{" "}
                      Hosts
                    </div>
                    <div className={classes.statBottom}>
                      {
                        project.scope.networksConnection.hostsConnection
                          .servicesConnection.totalCount
                      }{" "}
                      Services
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={6} />
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={pageSizeOptions}
              colSpan={3}
              count={totalCount}
              rowsPerPage={pageSize}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to === -1 ? totalCount : to} of ${count}`
              }
              page={page}
              SelectProps={{
                native: true,
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export const Icon = <ViewListIcon />;
export const Name = "Table View";

registerComponent("ProjectsViewTableView", ProjectsViewTableView);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectsViewTableView;
