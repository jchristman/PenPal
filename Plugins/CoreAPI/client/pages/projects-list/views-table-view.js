import React, { useState } from "react";
import { Components, registerComponent } from "meteor/penpal";
import { useHistory } from "react-router-dom";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableFooter from "@material-ui/core/TableFooter";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import FirstPageIcon from "@material-ui/icons/FirstPage";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import LastPageIcon from "@material-ui/icons/LastPage";
import ViewListIcon from "@material-ui/icons/ViewList";
import { makeStyles, useTheme } from "@material-ui/core/styles";

const useStyles1 = makeStyles((theme) => ({
  root: {
    flexShrink: 0,
    marginLeft: theme.spacing(2.5)
  }
}));

const TablePaginationActions = ({ count, page, rowsPerPage, onChangePage }) => {
  const classes = useStyles1();

  const handleFirstPageButtonClick = (event) => {
    onChangePage(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onChangePage(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onChangePage(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
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
    minWidth: 500
  },
  clickable: {
    cursor: "pointer",
    transform: "scale(1)",
    zIndex: 1,

    "&:after": {
      content: '""',
      display: "block",
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.05)",
      opacity: 0,
      zIndex: 1000
    },

    "&:hover:after": {
      opacity: 1
    }
  },
  statContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: theme.spacing(1.5),
    marginLeft: theme.spacing(1.5)
  },
  statTitle: {},
  statTopBottom: {
    display: "flex",
    flexDirection: "column"
  },
  statTop: {},
  summaryContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginRight: theme.spacing(1.5),
    marginLeft: theme.spacing(1.5)
  },
  summaryTitle: {
    width: 130,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: theme.spacing(2)
  },
  summaryTopBottom: {
    display: "flex",
    flexDirection: "column"
  },
  summaryTop: {}
}));

const ProjectsViewTableView = ({
  page,
  setPage,
  pageSize,
  setPageSize,
  pageSizeOptions,
  projectSummaries: { projects, totalCount }
}) => {
  const classes = useStyles2();
  const history = useHistory();

  const navToProject = (id) => {
    history.push(`/projects/${id}`);
  };

  const emptyRows = pageSize - Math.min(pageSize, projects.length);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <TableContainer component={Paper}>
      <Table className={classes.table}>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              className={classes.clickable}
              onClick={() => navToProject(project.id)}
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
                native: true
              }}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
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
