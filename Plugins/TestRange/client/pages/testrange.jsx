import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Components, registerComponent, Hooks } from "@penpal/core";
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  RefreshCw,
  Server,
  Clock,
  Package,
} from "lucide-react";

import GetRunningContainers from "./testrange/queries/get-running-containers.js";
import GetAvailableContainers from "./testrange/queries/get-available-containers.js";
import GetRecentContainers from "./testrange/queries/get-recent-containers.js";
import StartContainerMutation from "./testrange/mutations/start-container.js";
import StopContainerMutation from "./testrange/mutations/stop-container.js";
import RemoveContainerMutation from "./testrange/mutations/remove-container.js";
import RestartContainerMutation from "./testrange/mutations/restart-container.js";
import DeployVulhubContainerMutation from "./testrange/mutations/deploy-vulhub-container.js";

const { useToast } = Hooks;

const TestRange = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("running");

  // Queries
  const {
    data: runningData,
    loading: runningLoading,
    refetch: refetchRunning,
  } = useQuery(GetRunningContainers, {
    pollInterval: 5000, // Poll every 5 seconds
  });

  const {
    data: availableData,
    loading: availableLoading,
    refetch: refetchAvailable,
  } = useQuery(GetAvailableContainers);

  const {
    data: recentData,
    loading: recentLoading,
    refetch: refetchRecent,
  } = useQuery(GetRecentContainers, {
    variables: { limit: 50 },
  });

  // Mutations
  const [startContainer] = useMutation(StartContainerMutation);
  const [stopContainer] = useMutation(StopContainerMutation);
  const [removeContainer] = useMutation(RemoveContainerMutation);
  const [restartContainer] = useMutation(RestartContainerMutation);
  const [deployContainer] = useMutation(DeployVulhubContainerMutation);

  const handleStart = async (containerId) => {
    try {
      await startContainer({ variables: { containerId } });
      toast({
        title: "Container Started",
        description: "Container has been started successfully.",
      });
      refetchRunning();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStop = async (containerId) => {
    try {
      await stopContainer({ variables: { containerId } });
      toast({
        title: "Container Stopped",
        description: "Container has been stopped successfully.",
      });
      refetchRunning();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (containerId) => {
    if (
      !confirm("Are you sure you want to remove this container? This cannot be undone.")
    ) {
      return;
    }

    try {
      await removeContainer({ variables: { containerId } });
      toast({
        title: "Container Removed",
        description: "Container has been removed successfully.",
      });
      refetchRunning();
      refetchRecent();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRestart = async (containerId) => {
    try {
      await restartContainer({ variables: { containerId } });
      toast({
        title: "Container Restarted",
        description: "Container has been restarted successfully.",
      });
      refetchRunning();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeploy = async (containerPath, containerName) => {
    try {
      const result = await deployContainer({
        variables: { containerPath, containerName },
      });
      toast({
        title: "Container Deployed",
        description: `Successfully deployed ${result.data.deployVulhubContainer.containers.length} container(s).`,
      });
      refetchRunning();
      refetchRecent();
    } catch (error) {
      toast({
        title: "Deployment Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const runningContainers = runningData?.getRunningContainers || [];
  const availableContainers = availableData?.getAvailableContainers || [];
  const recentContainers = recentData?.getRecentContainers || [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Test Range</h1>
        <p className="text-gray-600">
          Manage vulnerable containers for testing and scanning
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("running")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "running"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Server className="inline-block mr-2" size={16} />
            Running ({runningContainers.length})
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "recent"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Clock className="inline-block mr-2" size={16} />
            Recent ({recentContainers.length})
          </button>
          <button
            onClick={() => setActiveTab("available")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "available"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Package className="inline-block mr-2" size={16} />
            Available ({availableContainers.length})
          </button>
        </nav>
      </div>

      {/* Running Containers Tab */}
      {activeTab === "running" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Running Containers</h2>
            <Components.Button
              onClick={() => refetchRunning()}
              variant="outline"
              size="sm"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Components.Button>
          </div>

          {runningLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : runningContainers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No running containers
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {runningContainers.map((container) => (
                    <tr key={container.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {container.name}
                        </div>
                        <div className="text-sm text-gray-500">{container.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            container.status.includes("Up")
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {container.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {container.ipAddress || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {container.portMappings && container.portMappings.length > 0 ? (
                          <div className="space-y-1">
                            {container.portMappings.map((pm, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-mono">
                                  {pm.hostPort}:{pm.containerPort}
                                </span>
                                {pm.protocol && (
                                  <span className="text-gray-500 ml-1">/{pm.protocol}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {container.image}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {!container.status.includes("Up") && (
                            <Components.Button
                              onClick={() => handleStart(container.fullId)}
                              variant="ghost"
                              size="sm"
                            >
                              <Play size={16} />
                            </Components.Button>
                          )}
                          {container.status.includes("Up") && (
                            <>
                              <Components.Button
                                onClick={() => handleStop(container.fullId)}
                                variant="ghost"
                                size="sm"
                              >
                                <Square size={16} />
                              </Components.Button>
                              <Components.Button
                                onClick={() => handleRestart(container.fullId)}
                                variant="ghost"
                                size="sm"
                              >
                                <RotateCw size={16} />
                              </Components.Button>
                            </>
                          )}
                          <Components.Button
                            onClick={() => handleRemove(container.fullId)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </Components.Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Recent Containers Tab */}
      {activeTab === "recent" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Containers</h2>
            <Components.Button
              onClick={() => refetchRecent()}
              variant="outline"
              size="sm"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Components.Button>
          </div>

          {recentLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : recentContainers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent containers
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Container Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vulhub Path
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deployed At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentContainers.map((container) => (
                    <tr key={container.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {container.containerName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {container.image}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {container.vulhubPath}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {container.portMappings && container.portMappings.length > 0 ? (
                          <div className="space-y-1">
                            {container.portMappings.map((pm, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-mono">
                                  {pm.hostPort}:{pm.containerPort}
                                </span>
                                {pm.protocol && (
                                  <span className="text-gray-500 ml-1">/{pm.protocol}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(container.deployedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Components.Button
                          onClick={() => {
                            // Extract container name from vulhubPath (e.g., "nextjs/CVE-2025-29927" -> "CVE-2025-29927")
                            const containerName = container.vulhubPath.split("/").pop();
                            handleDeploy(container.vulhubPath, containerName);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Play size={16} className="mr-2" />
                          Deploy
                        </Components.Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Available Containers Tab */}
      {activeTab === "available" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Available Containers</h2>
            <Components.Button
              onClick={() => refetchAvailable()}
              variant="outline"
              size="sm"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Components.Button>
          </div>

          {availableLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : availableContainers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No available containers. Cloning Vulhub repository...
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Path
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableContainers.map((container) => (
                    <tr key={container.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {container.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{container.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {container.relativePath}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Components.Button
                          onClick={() =>
                            handleDeploy(container.relativePath, container.name)
                          }
                          variant="default"
                          size="sm"
                        >
                          <Play size={16} className="mr-2" />
                          Deploy
                        </Components.Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

registerComponent("TestRange", TestRange);
export default TestRange;

