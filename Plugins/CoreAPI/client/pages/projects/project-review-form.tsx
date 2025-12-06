import React, { useState } from "react";
import { Components, registerComponent, Utils, Hooks } from "@penpal/core";
import PenPal from "@penpal/core";
import _ from "lodash";

import { useMutation, useQuery, useApolloClient } from "@apollo/client";

import CreateProjectMutation from "./mutations/create-project.ts";
import GetProjectSummaries from "./queries/get-project-summaries.ts";

const { cn } = Utils;
const { useToast } = Hooks;
const { Button, Card, CardContent, Table, TableBody, TableCell, TableRow } =
  Components;

const ReviewTableRow = ({ title, data }: { title: string; data: any }) => (
  <TableRow>
    <TableCell className="font-medium">{title}</TableCell>
    <TableCell className="text-right w-40">{data}</TableCell>
  </TableRow>
);

interface ProjectReviewFormProps {
  customers: any[];
  selectedCustomer: string;
  projectName: string;
  projectDescription: string;
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  projectIPs: string[];
  projectNetworks: string[];
  projectDomains: string[];
  projectProfile: any;
  handleClose?: () => void;
}

const ProjectReviewForm = ({
  customers,
  selectedCustomer,
  projectName,
  projectDescription,
  projectStartDate,
  projectEndDate,
  projectIPs,
  projectNetworks,
  projectDomains,
  projectProfile,
  handleClose = () => null,
}: ProjectReviewFormProps) => {
  const { toast } = useToast();
  const apolloClient = useApolloClient();
  const [projectCreationInProgress, setProjectCreationInProgress] =
    useState(false);

  // Fetch profiles to display profile name in review
  const { data: { getPluginProfiles = [] } = {} } = useQuery(PenPal.Profiles.GetProfiles);

  const [
    createProject,
    { loading: create_project_loading, error: create_project_error },
  ] = useMutation(CreateProjectMutation, {
    // Optimistically update the cache for immediate UI feedback
    update: (cache, { data: { createProject: newProject } }) => {
      if (!newProject) return;

      // Try to optimistically update the current view if possible
      // This provides immediate feedback before the refetch completes
      try {
        const existingData = cache.readQuery({
          query: GetProjectSummaries,
          variables: {
            pageSize: 10,
            pageNumber: 0,
          },
        }) as { getProjects?: any } | null;

        if (existingData?.getProjects) {
          // Add new project to the beginning of the list
          cache.writeQuery({
            query: GetProjectSummaries,
            variables: {
              pageSize: 10,
              pageNumber: 0,
            },
            data: {
              getProjects: {
                ...existingData.getProjects,
                projects: [newProject, ...existingData.getProjects.projects],
                totalCount: existingData.getProjects.totalCount + 1,
              },
            },
          });
        }
      } catch (e) {
        // If cache read/write fails, that's okay - refetchQueries will handle it
      }

      // Refetch all active GetProjectSummaries queries
      // This ensures all queries are refetched regardless of their variables
      // The `include` option will refetch all queries matching GetProjectSummaries
      apolloClient.refetchQueries({
        include: [GetProjectSummaries],
      });
    },
  });

  // Get profile name from ID
  const selectedProfile = projectProfile
    ? getPluginProfiles.find((p: any) => p.id === projectProfile)
    : null;
  const profileDisplayName = selectedProfile ? selectedProfile.name : "None";

  const handleCreateProject = async () => {
    setProjectCreationInProgress(true);

    try {
      await createProject({
        variables: {
          name: projectName,
          description: projectDescription,
          customer: customers[parseInt(selectedCustomer)].id,
          start_date:
            projectStartDate === null
              ? null
              : projectStartDate.toISOString().split("T")[0],
          end_date:
            projectEndDate === null
              ? null
              : projectEndDate.toISOString().split("T")[0],
          project_ips: projectIPs,
          project_networks: projectNetworks,
          project_domains: projectDomains || [],
          profile: projectProfile || null,
        },
      });

      toast({
        title: "Success",
        description: `Project '${projectName}' created successfully!`,
        variant: "default",
      });

      handleClose();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setProjectCreationInProgress(false);
    }
  };

  console.log(projectStartDate, projectEndDate);

  return (
    <div className="flex flex-col justify-center items-center h-full w-full">
      <div className="flex-1 w-full max-w-2xl flex flex-col justify-center items-center mb-4">
        <Card className="w-full">
          <CardContent className="p-6">
            <Table className="w-full">
              <TableBody>
                <ReviewTableRow
                  title="Customer"
                  data={customers[parseInt(selectedCustomer)].name}
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
                      : projectStartDate.toLocaleDateString()
                  }
                />
                <ReviewTableRow
                  title="End Date"
                  data={
                    projectEndDate === null
                      ? "None"
                      : projectEndDate.toLocaleDateString()
                  }
                />
                <ReviewTableRow title="# Hosts" data={projectIPs.length} />
                <ReviewTableRow
                  title="# Networks"
                  data={projectNetworks.length}
                />
                {projectDomains && projectDomains.length > 0 && (
                  <ReviewTableRow
                    title="# Domains"
                    data={projectDomains.length}
                  />
                )}
                <ReviewTableRow
                  title="Profile"
                  data={profileDisplayName}
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
