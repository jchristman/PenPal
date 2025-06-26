import React, { useState } from "react";
import { Components, registerComponent, Utils, Hooks } from "@penpal/core";
import _ from "lodash";

import { useMutation } from "@apollo/client";

import CreateProjectMutation from "./mutations/create-project.js";
import GetProjectSummaries from "./queries/get-project-summaries.js";
import ProjectFieldsFragment from "./queries/project-summary-fragment.js";

const { cn } = Utils;
const { useToast } = Hooks;
const { Button, Card, CardContent, Table, TableBody, TableCell, TableRow } =
  Components;

const ReviewTableRow = ({ title, data }) => (
  <TableRow>
    <TableCell className="font-medium">{title}</TableCell>
    <TableCell className="text-right w-40">{data}</TableCell>
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
  const { toast } = useToast();
  const [projectCreationInProgress, setProjectCreationInProgress] =
    useState(false);

  const [
    createProject,
    { loading: create_project_loading, error: create_project_error },
  ] = useMutation(CreateProjectMutation, {
    update(cache, { data: { createProject: new_project } }) {
      const current_projects =
        cache.readQuery({ query: GetProjectSummaries })?.getProjects ?? [];
      const data = { getProjects: [...current_projects, new_project] };
      cache.writeQuery({
        query: GetProjectSummaries,
        data,
        overwrite: true,
      });
    },
  });

  const handleCreateProject = async () => {
    setProjectCreationInProgress(true);

    try {
      await createProject({
        variables: {
          name: projectName,
          description: projectDescription,
          customer: customers[selectedCustomer].id,
          start_date:
            projectStartDate === null
              ? null
              : projectStartDate.format("YYYY-MM-DD"),
          end_date:
            projectEndDate === null
              ? null
              : projectEndDate.format("YYYY-MM-DD"),
          project_ips: projectIPs,
          project_networks: projectNetworks,
        },
      });

      toast({
        title: "Success",
        description: `Project '${projectName}' created successfully!`,
        variant: "default",
      });

      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProjectCreationInProgress(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-full w-full">
      <div className="flex-1 w-full max-w-2xl flex flex-col justify-center items-center mb-4">
        <Card className="w-full">
          <CardContent className="p-6">
            <Table>
              <TableBody>
                <ReviewTableRow
                  title="Customer"
                  data={customers[selectedCustomer].name}
                />
                <ReviewTableRow title="Project Name" data={projectName} />
                <ReviewTableRow
                  title="Project Description"
                  data={projectDescription}
                />
                <ReviewTableRow
                  title="Start Date"
                  data={
                    projectStartDate === null
                      ? "None"
                      : projectStartDate.format("MM/DD/yyyy")
                  }
                />
                <ReviewTableRow
                  title="End Date"
                  data={
                    projectEndDate === null
                      ? "None"
                      : projectEndDate.format("MM/DD/yyyy")
                  }
                />
                <ReviewTableRow title="# Hosts" data={projectIPs.length} />
                <ReviewTableRow
                  title="# Networks"
                  data={projectNetworks.length}
                />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="w-full max-w-2xl flex justify-end mb-4">
        <Button
          onClick={handleCreateProject}
          disabled={projectCreationInProgress}
          className="px-8"
        >
          Create Project
        </Button>
      </div>
    </div>
  );
};

registerComponent("NewProjectWorkflowReview", ProjectReviewForm);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectReviewForm;
