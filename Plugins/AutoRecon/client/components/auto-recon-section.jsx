import React, { useState, useEffect, useMemo } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";
import PenPal from "@penpal/core";
import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import {
  MagnifyingGlassIcon as SearchIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

// Import GraphQL queries/mutations/subscriptions
import StartAutoReconScan from "../queries/start-auto-recon-scan.js";

const { useToast } = Hooks;
const { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } =
  Components;

// AutoRecon Section Component - full AutoRecon UI
const AutoReconSection = ({ project }) => {
  const { toast } = useToast();
  const [scanInProgress, setScanInProgress] = useState(false);
  const [stagedAssetsDrawerOpen, setStagedAssetsDrawerOpen] = useState(false);

  // Query for AutoRecon jobs for this project
  const {
    data: jobsData,
    loading: jobsLoading,
    refetch: refetchJobs,
  } = useQuery(
    gql`
      query GetAutoReconJobs {
        getAllJobs(filterMode: "all") {
          jobs {
            id
            name
            plugin
            progress
            statusText
            status
            stages {
              name
              progress
              statusText
              status
            }
            created_at
            updated_at
            project_id
          }
        }
      }
    `,
    {
      pollInterval: 2000, // Poll every 2 seconds for job updates
    }
  );

  // Query for staged assets
  const {
    data: assetsData,
    loading: assetsLoading,
    refetch: refetchAssets,
  } = useQuery(GetStagedAssets, {
    variables: { projectId: project.id },
    pollInterval: 3000, // Poll every 3 seconds
  });

  // Mutations
  const [startScanMutation] = useMutation(StartAutoReconScan);
  const [acceptAssetsMutation] = useMutation(AcceptStagedAssets);
  const [rejectAssetsMutation] = useMutation(RejectStagedAssets);

  const allJobs = jobsData?.getAllJobs?.jobs || [];
  const autoreconJobs = allJobs.filter(
    (job) => job.plugin === "AutoRecon" && job.project_id === project.id
  );
  const stagedAssets = assetsData?.getStagedAssets || [];
  const activeJob = autoreconJobs.find(
    (job) => job.status === "running" || job.status === "pending"
  );

  const handleStartScan = async () => {
    try {
      setScanInProgress(true);
      const result = await startScanMutation({
        variables: { projectId: project.id },
      });

      if (result.data?.startAutoReconScan) {
        toast({
          title: "AutoRecon Started",
          description: "Asset discovery scan has been initiated.",
        });
        refetchJobs();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to start AutoRecon scan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setScanInProgress(false);
    }
  };

  const handleAcceptAssets = async () => {
    if (selectedAssetIds.length === 0) {
      toast({
        title: "No Assets Selected",
        description: "Please select assets to accept.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await acceptAssetsMutation({
        variables: {
          projectId: project.id,
          assetIds: selectedAssetIds,
        },
      });

      if (result.data?.acceptStagedAssets) {
        const { accepted, rejected } = result.data.acceptStagedAssets;
        toast({
          title: "Assets Accepted",
          description: `Successfully added ${accepted} assets to project scope. ${
            rejected > 0 ? `${rejected} failed.` : ""
          }`,
        });
        setSelectedAssetIds([]);
        refetchAssets();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to accept assets: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleRejectAssets = async () => {
    if (selectedAssetIds.length === 0) {
      toast({
        title: "No Assets Selected",
        description: "Please select assets to reject.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await rejectAssetsMutation({
        variables: {
          projectId: project.id,
          assetIds: selectedAssetIds,
        },
      });

      if (result.data?.rejectStagedAssets) {
        toast({
          title: "Assets Rejected",
          description: `${selectedAssetIds.length} assets have been removed.`,
        });
        setSelectedAssetIds([]);
        refetchAssets();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to reject assets: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-t pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            AutoRecon - Automated Subdomain Discovery
          </h3>
          <p className="text-sm text-gray-600">
            Discover subdomains that may be in scope using multiple enumeration
            tools in a containerized environment
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleStartScan}
            disabled={scanInProgress || !!activeJob}
            className={`px-4 py-2 text-sm rounded ${
              activeJob
                ? "bg-gray-200 text-gray-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {scanInProgress
              ? "Starting..."
              : activeJob
              ? "Scan In Progress"
              : "Start AutoRecon"}
          </button>
        </div>
      </div>

      {/* Job Status */}
      {activeJob && (
        <div className="mb-6 p-4 border rounded-lg bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Scan in Progress</h4>
              <p className="text-sm text-gray-600">{activeJob.statusText}</p>
            </div>
            <div className="text-sm text-gray-600">
              {Math.round(activeJob.progress || 0)}%
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${activeJob.progress || 0}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Staged Assets */}
      {stagedAssets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">
              Staged Assets ({stagedAssets.length})
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleRejectAssets}
                disabled={selectedAssetIds.length === 0}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Reject Selected ({selectedAssetIds.length})
              </button>
              <button
                onClick={handleAcceptAssets}
                disabled={selectedAssetIds.length === 0}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Add to Scope ({selectedAssetIds.length})
              </button>
            </div>
          </div>

          <div className="border rounded-md max-h-80 overflow-auto">
            {stagedAssets.map((asset) => (
              <label
                key={asset.id}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedAssetIds.includes(asset.id)}
                  onChange={(e) =>
                    setSelectedAssetIds((prev) =>
                      e.target.checked
                        ? [...prev, asset.id]
                        : prev.filter((id) => id !== asset.id)
                    )
                  }
                  className="rounded"
                />
                <span className="text-lg">
                  {asset.type === "domain"
                    ? "🌐"
                    : asset.type === "host"
                    ? "🖥️"
                    : "📄"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {asset.type === "domain" && asset.metadata?.resolved_ip
                      ? `${asset.value} (${asset.metadata.resolved_ip})`
                      : asset.value}
                  </div>
                  <div className="text-xs text-gray-500">
                    Discovered via {asset.tool} • {asset.confidence}% confidence
                  </div>
                </div>
                <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                  {asset.type}
                </span>
              </label>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Select subdomains above to add them to your project scope as
            domains. Only selected subdomains will be included.
          </p>
        </div>
      )}

      {/* Recent Jobs */}
      {autoreconJobs.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Recent Scans</h4>
          <div className="space-y-2">
            {autoreconJobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <p className="font-medium text-sm">
                    {new Date(job.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{job.statusText}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    job.status === "done"
                      ? "bg-green-100 text-green-800"
                      : job.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : job.status === "running"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stagedAssets.length === 0 &&
        !activeJob &&
        autoreconJobs.filter((j) => j.status === "done").length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>
              No staged subdomains. Start an AutoRecon scan to discover
              potential subdomains in scope.
            </p>
          </div>
        )}
    </div>
  );
};

// AutoRecon Buttons Component - provides button for the project scope header
const AutoReconButtons = ({ project }) => {
  const { toast } = useToast();
  const [scanInProgress, setScanInProgress] = useState(false);

  // Query for AutoRecon jobs for this project
  const { data: jobsData, refetch: refetchJobs } = useQuery(
    gql`
      query GetAutoReconJobs {
        getAllJobs(filterMode: "all") {
          jobs {
            id
            name
            plugin
            progress
            statusText
            status
            stages {
              name
              progress
              statusText
              status
            }
            created_at
            updated_at
            project_id
          }
        }
      }
    `,
    {
      pollInterval: 2000, // Poll every 2 seconds for job updates
    }
  );

  // Mutation for starting scan
  const [startScanMutation] = useMutation(StartAutoReconScan);

  const allJobs = jobsData?.getAllJobs?.jobs || [];
  const autoreconJobs = allJobs.filter(
    (job) => job.plugin === "AutoRecon" && job.project_id === project.id
  );
  const activeJob = autoreconJobs.find(
    (job) => job.status === "running" || job.status === "pending"
  );

  const handleStartScan = async () => {
    try {
      setScanInProgress(true);
      const result = await startScanMutation({
        variables: { projectId: project.id },
      });

      if (result.data?.startAutoReconScan) {
        toast({
          title: "AutoRecon Started",
          description: "Asset discovery scan has been initiated.",
        });
        refetchJobs();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to start AutoRecon scan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setScanInProgress(false);
    }
  };

  return (
    <Components.Button
      variant="outline"
      onClick={handleStartScan}
      disabled={scanInProgress || !!activeJob}
      className="flex items-center gap-2"
    >
      <SearchIcon className="h-4 w-4" />
      {scanInProgress
        ? "Starting..."
        : activeJob
        ? "Scan In Progress"
        : "Start AutoRecon"}
    </Components.Button>
  );
};

registerComponent("AutoReconSection", AutoReconSection);
registerComponent("AutoReconButtons", AutoReconButtons);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default AutoReconSection;
export { AutoReconButtons };
