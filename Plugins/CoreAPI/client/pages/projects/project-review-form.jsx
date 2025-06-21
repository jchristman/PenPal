import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import _ from "lodash";
import cx from "classnames";

import { makeStyles, useTheme } from "@mui/styles";
import { grey, indigo } from "@mui/material/colors";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TableContainer from "@mui/material/TableContainer";

import { useSnackbar } from "notistack";
import { useMutation } from "@apollo/client";

import CreateProjectMutation from "./mutations/create-project.js";
import GetProjectSummaries from "./queries/get-project-summaries.js";
import ProjectFieldsFragment from "./queries/project-summary-fragment.js";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },
  top_pane: {
    flex: 1,
    width: "70%",
    maxWidth: 700,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing(2),
  },
  bottom_pane: {
    width: "70%",
    maxWidth: 700,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: theme.spacing(2),
  },
  table: {
    width: "100%",
  },
}));

const ReviewTableRow = ({ title, data }) => (
  <TableRow>
    <TableCell component="th" scope="row">
      {title}
    </TableCell>
    <TableCell style={{ width: 160 }} align="right">
      {data}
    </TableCell>
  </TableRow>
);

const ProjectReviewForm = ({
  customers,
  selectedCustomer,
  projectName,
  projectDescription,
  projectStartDate,
  projectEndDate,
  projectIPs,
  projectNetworks,
  handleClose = () => null,
}) => {
  // ----------------------------------------------------

  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  const [projectCreationInProgress, setProjectCreationInProgress] =
    useState(false);

  const [createProject] = useMutation(CreateProjectMutation, {
    update(cache, { data: { createProject: new_project } }) {
      cache.modify({
        fields: {
          getProjects({ projects, totalCount, ...other }) {
            const newProjectRef = cache.writeFragment({
              data: new_project,
              fragment: ProjectFieldsFragment,
            });
            return {
              projects: [newProjectRef, ...projects],
              totalCount: totalCount + 1,
              ...other,
            };
          },
        },
      });
    },
  });

  // ----------------------------------------------------

  const handleCreateProject = async () => {
    setProjectCreationInProgress(true);

    const variables = _.pickBy({
      customer: customers[selectedCustomer].id,
      name: projectName,
      description: projectDescription,
      start_date: projectStartDate,
      end_date: projectEndDate,
      project_ips: projectIPs,
      project_networks: projectNetworks,
    });

    try {
      const result = await createProject({
        variables,
      });

      handleClose();
    } catch (e) {
      console.error("Create project", e);
      enqueueSnackbar(e.message, { variant: "error", autoHideDuration: 10000 });
    }

    setProjectCreationInProgress(false);
  };

  // ----------------------------------------------------

  return (
    <div className={classes.root}>
      <div className={classes.top_pane}>
        <Table className={classes.table}>
          <TableBody>
            <ReviewTableRow
              title={"Customer"}
              data={customers[selectedCustomer].name}
            />
            <ReviewTableRow title={"Project Name"} data={projectName} />
            <ReviewTableRow
              title={"Project Description"}
              data={projectDescription}
            />
            <ReviewTableRow
              title={"Start Date"}
              data={
                projectStartDate === null
                  ? "None"
                  : projectStartDate.format("MM/DD/yyyy")
              }
            />
            <ReviewTableRow
              title={"End Date"}
              data={
                projectEndDate === null
                  ? "None"
                  : projectEndDate.format("MM/DD/yyyy")
              }
            />
            <ReviewTableRow title={"# Hosts"} data={projectIPs.length} />
            <ReviewTableRow
              title={"# Networks"}
              data={projectNetworks.length}
            />
          </TableBody>
        </Table>
      </div>
      <div className={classes.bottom_pane}>
        <Components.StyledButton
          color="primary"
          onClick={handleCreateProject}
          disabled={projectCreationInProgress}
        >
          Create Project
        </Components.StyledButton>
      </div>
    </div>
  );
};

registerComponent("NewProjectWorkflowReview", ProjectReviewForm);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectReviewForm;
