import React, { useState, useEffect, useMemo } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";
import PenPal from "@penpal/core";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import GetNetworksInformation from "./queries/get-networks-information.js";
import GetHostsInformation from "./queries/get-hosts-information.js";
import { parseScopeInput } from "../projects/scope-parser.js";
import {
  PlusIcon,
  EyeIcon,
  MagnifyingGlassIcon as SearchIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
const { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } =
  Components;
import gql from "graphql-tag";

// Import domain queries
import GET_DOMAINS_BY_PROJECT from "./queries/get-domains-by-project.js";

const GetStagedAssets = gql`
  query GetStagedAssets($projectId: ID!) {
    getStagedAssets(projectId: $projectId) {
      id
      type
      value
      tool
      confidence
      classification
      metadata
      created_at
    }
  }
`;

const AcceptStagedAssets = gql`
  mutation AcceptStagedAssets($projectId: ID!, $assetIds: [ID!]!) {
    acceptStagedAssets(projectId: $projectId, assetIds: $assetIds) {
      accepted
      rejected
      errors
    }
  }
`;

const RejectStagedAssets = gql`
  mutation RejectStagedAssets($projectId: ID!, $assetIds: [ID!]!) {
    rejectStagedAssets(projectId: $projectId, assetIds: $assetIds) {
      accepted
      rejected
      errors
    }
  }
`;

const { useToast } = Hooks;
const { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } =
  Components;
// Note: Using slide-in panel pattern like project-view-services-table.jsx

// Remove the duplicate GET_DOMAINS_BY_PROJECT since we imported it
// const GET_DOMAINS_BY_PROJECT = gql`...`;

// Mutations for scope editing
const CREATE_NETWORKS = gql`
  mutation CreateNetworks($project: ID!, $subnets: [IPSubnet!]!) {
    createNetworks(project: $project, subnets: $subnets) {
      id
      subnet
    }
  }
`;

const REMOVE_NETWORKS = gql`
  mutation RemoveNetworks($ids: [ID!]!) {
    removeNetworks(ids: $ids)
  }
`;

const CREATE_HOSTS = gql`
  mutation CreateHosts($projectID: ID!, $hosts: [HostInput!]!) {
    createHosts(projectID: $projectID, hosts: $hosts) {
      id
      ip_address
      domain_ids
      domains {
        id
        name
      }
    }
  }
`;

const CREATE_DOMAIN = gql`
  mutation CreateDomain($domain: DomainInput!) {
    createDomain(domain: $domain) {
      id
      name
    }
  }
`;

const REMOVE_DOMAINS = gql`
  mutation RemoveDomains($ids: [ID!]!) {
    removeDomains(ids: $ids)
  }
`;

const REMOVE_HOSTS = gql`
  mutation RemoveHosts($ids: [ID!]!) {
    removeHosts(ids: $ids)
  }
`;

const ProjectViewDetails = ({ project, disable_polling }) => {
  const { toast } = useToast();

  // State for search filters
  const [networksSearch, setNetworksSearch] = useState("");
  const [hostsSearch, setHostsSearch] = useState("");
  const [domainsSearch, setDomainsSearch] = useState("");

  // State for sorting
  const [networksSort, setNetworksSort] = useState({
    key: "subnet",
    direction: "asc",
  });
  const [hostsSort, setHostsSort] = useState({
    key: "ip_address",
    direction: "asc",
  });
  const [domainsSort, setDomainsSort] = useState({
    key: "name",
    direction: "asc",
  });

  // State for host details drawer
  const [selectedHost, setSelectedHost] = useState(null);
  const [hostDetailsDrawerOpen, setHostDetailsDrawerOpen] = useState(false);

  const { data: networksData, refetch: refetchNetworks } = useQuery(
    GetNetworksInformation,
    {
      pollInterval: disable_polling ? 0 : 15000,
      variables: { id: project.id },
    }
  );

  const { data: hostsData, refetch: refetchHosts } = useQuery(
    GetHostsInformation,
    {
      pollInterval: disable_polling ? 0 : 15000,
      variables: { id: project.id },
    }
  );

  const { data: domainsData, refetch: refetchDomains } = useQuery(
    GET_DOMAINS_BY_PROJECT,
    {
      pollInterval: disable_polling ? 0 : 15000,
      variables: { projectId: project.id },
    }
  );

  const [createNetworks] = useMutation(CREATE_NETWORKS, {
    onCompleted: () => {
      refetchNetworks();
    },
  });
  const [removeNetworks] = useMutation(REMOVE_NETWORKS);
  const [createHosts] = useMutation(CREATE_HOSTS, {
    onCompleted: () => {
      refetchHosts();
    },
  });
  const [createDomain] = useMutation(CREATE_DOMAIN, {
    onCompleted: () => {
      refetchDomains();
    },
  });
  const [getDomainsByProject] = useLazyQuery(GET_DOMAINS_BY_PROJECT);
  const [removeDomains] = useMutation(REMOVE_DOMAINS);
  const [removeHosts] = useMutation(REMOVE_HOSTS);

  // Staged assets state
  const [stagedAssetsDrawerOpen, setStagedAssetsDrawerOpen] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);

  // Query for staged assets
  const { data: assetsData, refetch: refetchAssets } = useQuery(
    GetStagedAssets,
    {
      variables: { projectId: project.id },
      pollInterval: 3000,
    }
  );

  const [acceptAssetsMutation] = useMutation(AcceptStagedAssets);
  const [rejectAssetsMutation] = useMutation(RejectStagedAssets);

  const networks =
    networksData?.getProject?.scope?.networksConnection?.networks || [];
  const hosts = hostsData?.getHostsByProjectID || [];
  const domains = domainsData?.getDomainsByProject?.domains || [];

  // Staged assets data
  const stagedAssets = assetsData?.getStagedAssets || [];

  // Filter and sort networks
  const filteredAndSortedNetworks = useMemo(() => {
    let filtered = networks;

    // Apply search filter
    if (networksSearch.trim()) {
      const searchTerm = networksSearch.toLowerCase();
      filtered = filtered.filter(
        (network) =>
          network.subnet.toLowerCase().includes(searchTerm) ||
          (network.domain && network.domain.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    if (networksSort.key) {
      filtered = [...filtered].sort((a, b) => {
        let aVal, bVal;

        switch (networksSort.key) {
          case "subnet":
            aVal = a.subnet || "";
            bVal = b.subnet || "";
            break;
          case "domain":
            aVal = a.domain || "";
            bVal = b.domain || "";
            break;
          case "hosts":
            aVal = a.hostsConnection?.totalCount || 0;
            bVal = b.hostsConnection?.totalCount || 0;
            return networksSort.direction === "asc" ? aVal - bVal : bVal - aVal;
          default:
            return 0;
        }

        if (networksSort.key !== "hosts") {
          const result = aVal.localeCompare(bVal);
          return networksSort.direction === "asc" ? result : -result;
        }

        return networksSort.direction === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [networks, networksSearch, networksSort]);

  // Filter and sort hosts
  const filteredAndSortedHosts = useMemo(() => {
    let filtered = hosts.filter((host) => host && host.id);

    // Apply search filter
    if (hostsSearch.trim()) {
      const searchTerm = hostsSearch.toLowerCase();
      filtered = filtered.filter(
        (host) =>
          host.ip_address.toLowerCase().includes(searchTerm) ||
          host.domains?.some((domain) =>
            domain?.name?.toLowerCase().includes(searchTerm)
          ) ||
          host.classification?.country?.toLowerCase().includes(searchTerm) ||
          host.classification?.city?.toLowerCase().includes(searchTerm) ||
          host.classification?.org?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    if (hostsSort.key) {
      filtered = [...filtered].sort((a, b) => {
        let aVal, bVal;

        switch (hostsSort.key) {
          case "ip_address":
            aVal = a.ip_address || "";
            bVal = b.ip_address || "";
            break;
          case "domains":
            aVal = a.domains?.filter((d) => d?.name)?.length || 0;
            bVal = b.domains?.filter((d) => d?.name)?.length || 0;
            return hostsSort.direction === "asc" ? aVal - bVal : bVal - aVal;
          case "location":
            aVal = a.classification?.country || "";
            bVal = b.classification?.country || "";
            break;
          case "classification":
            aVal = a.classification?.org || "";
            bVal = b.classification?.org || "";
            break;
          default:
            return 0;
        }

        if (["domains"].includes(hostsSort.key)) {
          return hostsSort.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        const result = aVal.localeCompare(bVal);
        return hostsSort.direction === "asc" ? result : -result;
      });
    }

    return filtered;
  }, [hosts, hostsSearch, hostsSort]);

  // Filter and sort domains
  const filteredAndSortedDomains = useMemo(() => {
    let filtered = domains.filter(
      (domain) => domain && domain.id && domain.name
    );

    // Apply search filter
    if (domainsSearch.trim()) {
      const searchTerm = domainsSearch.toLowerCase();
      filtered = filtered.filter(
        (domain) =>
          domain.name.toLowerCase().includes(searchTerm) ||
          domain.resolved_ips?.some((ip) =>
            ip.toLowerCase().includes(searchTerm)
          )
      );
    }

    // Apply sorting
    if (domainsSort.key) {
      filtered = [...filtered].sort((a, b) => {
        let aVal, bVal;

        switch (domainsSort.key) {
          case "name":
            aVal = a.name || "";
            bVal = b.name || "";
            break;
          case "resolved_ips":
            aVal = a.resolved_ips?.length || 0;
            bVal = b.resolved_ips?.length || 0;
            return domainsSort.direction === "asc" ? aVal - bVal : bVal - aVal;
          case "status":
            aVal =
              a.resolved_ips && a.resolved_ips.length > 0
                ? "Resolved"
                : "Unresolved";
            bVal =
              b.resolved_ips && b.resolved_ips.length > 0
                ? "Resolved"
                : "Unresolved";
            break;
          default:
            return 0;
        }

        if (domainsSort.key === "resolved_ips") {
          return domainsSort.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        const result = aVal.localeCompare(bVal);
        return domainsSort.direction === "asc" ? result : -result;
      });
    }

    return filtered;
  }, [domains, domainsSearch, domainsSort]);

  // Handle host row click
  const handleHostClick = (host) => {
    setSelectedHost(host);
    setHostDetailsDrawerOpen(true);
  };

  // Handle sort functions
  const handleNetworksSort = (key) => {
    setNetworksSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleHostsSort = (key) => {
    setHostsSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleDomainsSort = (key) => {
    setDomainsSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const [bulkInput, setBulkInput] = useState("");
  const [selectedNetworkIds, setSelectedNetworkIds] = useState([]);
  const [selectedHostIds, setSelectedHostIds] = useState([]);
  const [selectedDomainIds, setSelectedDomainIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleBulkParse = async () => {
    if (!bulkInput.trim()) return;

    setIsProcessing(true);
    try {
      const parsed = parseScopeInput(bulkInput);

      // Get existing IPs and networks to avoid duplicates
      const existingIPs = new Set(hosts.map((h) => h.ip_address));
      const existingNetworks = new Set(networks.map((n) => n.subnet));

      // Add networks
      const newNetworks = parsed.networks.filter(
        (net) => !existingNetworks.has(net)
      );
      if (newNetworks.length > 0) {
        await createNetworks({
          variables: { project: project.id, subnets: newNetworks },
        });
      }

      // Add IPs
      const newIPs = parsed.ips.filter((ip) => !existingIPs.has(ip));
      if (newIPs.length > 0) {
        await createHosts({
          variables: {
            projectID: project.id,
            hosts: newIPs.map((ip) => ({
              project: project.id,
              ip_address: ip,
            })),
          },
        });
      }

      // Add domains directly (domains can now exist without hosts)
      let newDomains = [];
      if (parsed.domains.length > 0) {
        // Get existing domains for this project to avoid duplicates
        const existingDomainsQuery = await getDomainsByProject({
          variables: { projectId: project.id },
        });
        const existingDomainNames = new Set(
          existingDomainsQuery.data.getDomainsByProject.domains.map(
            (d) => d.name
          )
        );

        newDomains = parsed.domains.filter(
          (domain) => !existingDomainNames.has(domain)
        );

        if (newDomains.length > 0) {
          await Promise.all(
            newDomains.map((domain) =>
              createDomain({
                variables: {
                  domain: {
                    project: project.id,
                    name: domain,
                  },
                },
              })
            )
          );
        }
      }

      setBulkInput("");
      toast({
        title: "Success",
        description: `Added ${newNetworks.length} networks, ${newIPs.length} hosts, and ${newDomains.length} domains`,
        variant: "default",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveNetworks = async () => {
    if (selectedNetworkIds.length === 0) return;
    try {
      await removeNetworks({ variables: { ids: selectedNetworkIds } });
      setSelectedNetworkIds([]);
      refetchNetworks();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveHosts = async () => {
    if (selectedHostIds.length === 0) return;
    try {
      await removeHosts({ variables: { ids: selectedHostIds } });
      setSelectedHostIds([]);
      refetchHosts();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveDomains = async () => {
    if (selectedDomainIds.length === 0) return;
    try {
      await removeDomains({ variables: { ids: selectedDomainIds } });
      setSelectedDomainIds([]);
      refetchDomains();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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
        refetchDomains(); // Refresh domains since they might have been added
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
        const { accepted, rejected } = result.data.rejectStagedAssets;
        toast({
          title: "Assets Rejected",
          description: `${rejected} assets have been removed.`,
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
    <div className="p-6 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Main Scope Section */}
      <Components.Card>
        <Components.CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Components.CardTitle>Project Scope</Components.CardTitle>
            <Components.CardDescription>
              View and edit networks, hosts, and domains in scope
            </Components.CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Buttons Section */}
            <div className="flex items-center gap-2">
              {/* Plugin-registered Project Scope Buttons */}
              {PenPal.ProjectScopeButtons.map((buttonConfig, index) => {
                const ButtonComponent = Components[buttonConfig.component];
                if (!ButtonComponent) {
                  console.warn(
                    `Project scope button component "${buttonConfig.component}" not found`
                  );
                  return null;
                }
                return (
                  <ButtonComponent
                    key={`${buttonConfig.name}-${index}`}
                    project={project}
                  />
                );
              })}

              {/* View Staged Assets Button */}
              <Components.Button
                variant="outline"
                onClick={() => setStagedAssetsDrawerOpen(true)}
                disabled={stagedAssets.length === 0}
                className="flex items-center gap-2"
              >
                <EyeIcon className="h-4 w-4" />
                View Staged Assets{" "}
                {stagedAssets.length > 0 && `(${stagedAssets.length})`}
              </Components.Button>
            </div>

            {/* Add Scope Items Button */}
            <Components.Button
              variant="outline"
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Scope Items
            </Components.Button>
          </div>
        </Components.CardHeader>
        <Components.CardContent className="space-y-6">
          {/* Networks Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Networks</h3>
                <Components.Input
                  placeholder="Filter networks..."
                  value={networksSearch}
                  onChange={(e) => setNetworksSearch(e.target.value)}
                  className="w-64"
                />
              </div>
              {selectedNetworkIds.length > 0 && (
                <Components.Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveNetworks}
                >
                  Remove Selected ({selectedNetworkIds.length})
                </Components.Button>
              )}
            </div>
            {filteredAndSortedNetworks.length > 0 ? (
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Components.Checkbox
                        checked={
                          filteredAndSortedNetworks.length > 0 &&
                          selectedNetworkIds.length ===
                            filteredAndSortedNetworks.length &&
                          filteredAndSortedNetworks.every((n) =>
                            selectedNetworkIds.includes(n.id)
                          )
                        }
                        indeterminate={
                          selectedNetworkIds.length > 0 &&
                          selectedNetworkIds.length <
                            filteredAndSortedNetworks.length &&
                          filteredAndSortedNetworks.some((n) =>
                            selectedNetworkIds.includes(n.id)
                          )
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedNetworkIds(
                              filteredAndSortedNetworks.map((n) => n.id)
                            );
                          } else {
                            setSelectedNetworkIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <SortableTableHead
                      sortKey="subnet"
                      currentSort={networksSort}
                      onSort={handleNetworksSort}
                    >
                      Network
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="domain"
                      currentSort={networksSort}
                      onSort={handleNetworksSort}
                    >
                      Domain
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="hosts"
                      currentSort={networksSort}
                      onSort={handleNetworksSort}
                      className="text-right"
                    >
                      Hosts
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedNetworks.map((network) => (
                    <TableRow key={network.id}>
                      <TableCell>
                        <Components.Checkbox
                          checked={selectedNetworkIds.includes(network.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedNetworkIds((prev) => [
                                ...prev,
                                network.id,
                              ]);
                            } else {
                              setSelectedNetworkIds((prev) =>
                                prev.filter((id) => id !== network.id)
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-mono">
                        {network.subnet}
                      </TableCell>
                      <TableCell>
                        {network.domain || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Components.Badge variant="outline">
                          {network.hostsConnection?.totalCount ?? 0}
                        </Components.Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                No networks in scope
              </div>
            )}
          </div>

          {/* Hosts Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Hosts</h3>
                <Components.Input
                  placeholder="Filter hosts..."
                  value={hostsSearch}
                  onChange={(e) => setHostsSearch(e.target.value)}
                  className="w-64"
                />
              </div>
              {selectedHostIds.length > 0 && (
                <Components.Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveHosts}
                >
                  Remove Selected ({selectedHostIds.length})
                </Components.Button>
              )}
            </div>
            {filteredAndSortedHosts.length > 0 ? (
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Components.Checkbox
                        checked={
                          filteredAndSortedHosts.length > 0 &&
                          selectedHostIds.length ===
                            filteredAndSortedHosts.length &&
                          filteredAndSortedHosts.every((h) =>
                            selectedHostIds.includes(h.id)
                          )
                        }
                        indeterminate={
                          selectedHostIds.length > 0 &&
                          selectedHostIds.length <
                            filteredAndSortedHosts.length &&
                          filteredAndSortedHosts.some((h) =>
                            selectedHostIds.includes(h.id)
                          )
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedHostIds(
                              filteredAndSortedHosts.map((h) => h.id)
                            );
                          } else {
                            setSelectedHostIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <SortableTableHead
                      sortKey="ip_address"
                      currentSort={hostsSort}
                      onSort={handleHostsSort}
                    >
                      IP Address
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="domains"
                      currentSort={hostsSort}
                      onSort={handleHostsSort}
                    >
                      Domains
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="location"
                      currentSort={hostsSort}
                      onSort={handleHostsSort}
                    >
                      Location
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="classification"
                      currentSort={hostsSort}
                      onSort={handleHostsSort}
                    >
                      Classification
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedHosts.map((host) => (
                    <TableRow
                      key={host.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleHostClick(host)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Components.Checkbox
                          checked={selectedHostIds.includes(host.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedHostIds((prev) => [...prev, host.id]);
                            } else {
                              setSelectedHostIds((prev) =>
                                prev.filter((id) => id !== host.id)
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-mono">
                        {host.ip_address}
                      </TableCell>
                      <TableCell>
                        {host.domains && host.domains.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {host.domains
                              .slice(0, 2)
                              .filter((domain) => domain && domain.name)
                              .map((domain, idx) => (
                                <Components.Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {domain.name}
                                </Components.Badge>
                              ))}
                            {host.domains.filter(
                              (domain) => domain && domain.name
                            ).length > 2 && (
                              <Components.Badge
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHostClick(host);
                                }}
                              >
                                +
                                {host.domains.filter(
                                  (domain) => domain && domain.name
                                ).length - 2}{" "}
                                more
                              </Components.Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {host.classification?.country ? (
                          <div className="text-xs">
                            <div className="font-medium">
                              {host.classification.city &&
                              host.classification.region
                                ? `${host.classification.city}, ${host.classification.region}`
                                : host.classification.city ||
                                  host.classification.region}
                            </div>
                            <div className="text-muted-foreground">
                              {host.classification.country}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Unknown
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {host.classification?.org && (
                            <Badge variant="outline" className="text-xs">
                              {host.classification.org}
                              {host.classification.asn &&
                                ` (ASN ${host.classification.asn})`}
                            </Badge>
                          )}
                          {host.classification?.cloud_provider?.provider && (
                            <Badge variant="secondary" className="text-xs">
                              {host.classification.cloud_provider.provider}
                              {host.classification.cloud_provider.service &&
                                ` (${host.classification.cloud_provider.service})`}
                            </Badge>
                          )}
                          {!host.classification?.org &&
                            !host.classification?.cloud_provider?.provider && (
                              <span className="text-muted-foreground text-sm">
                                Unknown
                              </span>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                No hosts in scope
              </div>
            )}
          </div>

          {/* Domains Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Domains</h3>
                <Components.Input
                  placeholder="Filter domains..."
                  value={domainsSearch}
                  onChange={(e) => setDomainsSearch(e.target.value)}
                  className="w-64"
                />
              </div>
              {selectedDomainIds.length > 0 && (
                <Components.Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveDomains}
                >
                  Remove Selected ({selectedDomainIds.length})
                </Components.Button>
              )}
            </div>
            {filteredAndSortedDomains.length > 0 ? (
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Components.Checkbox
                        checked={
                          filteredAndSortedDomains.length > 0 &&
                          selectedDomainIds.length ===
                            filteredAndSortedDomains.length &&
                          filteredAndSortedDomains.every((d) =>
                            selectedDomainIds.includes(d.id)
                          )
                        }
                        indeterminate={
                          selectedDomainIds.length > 0 &&
                          selectedDomainIds.length <
                            filteredAndSortedDomains.length &&
                          filteredAndSortedDomains.some((d) =>
                            selectedDomainIds.includes(d.id)
                          )
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDomainIds(
                              filteredAndSortedDomains.map((d) => d.id)
                            );
                          } else {
                            setSelectedDomainIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <SortableTableHead
                      sortKey="name"
                      currentSort={domainsSort}
                      onSort={handleDomainsSort}
                    >
                      Domain Name
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="resolved_ips"
                      currentSort={domainsSort}
                      onSort={handleDomainsSort}
                    >
                      Resolved IPs
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="status"
                      currentSort={domainsSort}
                      onSort={handleDomainsSort}
                      className="text-right"
                    >
                      Status
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedDomains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell>
                        <Components.Checkbox
                          checked={selectedDomainIds.includes(domain.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDomainIds((prev) => [
                                ...prev,
                                domain.id,
                              ]);
                            } else {
                              setSelectedDomainIds((prev) =>
                                prev.filter((id) => id !== domain.id)
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{domain.name}</TableCell>
                      <TableCell>
                        {domain.resolved_ips &&
                        domain.resolved_ips.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {domain.resolved_ips.slice(0, 2).map((ip, idx) => (
                              <Components.Badge
                                key={idx}
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {ip}
                              </Components.Badge>
                            ))}
                            {domain.resolved_ips.length > 2 && (
                              <Components.Badge
                                variant="outline"
                                className="text-xs"
                              >
                                +{domain.resolved_ips.length - 2} more
                              </Components.Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Not resolved
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Components.Badge
                          variant={
                            domain.resolved_ips &&
                            domain.resolved_ips.length > 0
                              ? "default"
                              : "secondary"
                          }
                        >
                          {domain.resolved_ips && domain.resolved_ips.length > 0
                            ? "Resolved"
                            : "Unresolved"}
                        </Components.Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                No domains in scope
              </div>
            )}
          </div>
        </Components.CardContent>
      </Components.Card>

      {/* AutoRecon functionality is now integrated into the main scope header */}

      {/* Bulk Add Dialog */}
      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Scope Items</DialogTitle>
            <DialogDescription>
              Add IPs, networks, or domains to the project scope. Items will be
              automatically categorized.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Components.Label htmlFor="bulk-input">Bulk Input</Components.Label>
            <Components.Textarea
              id="bulk-input"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  if (bulkInput.trim() && !isProcessing) {
                    handleBulkParse();
                  }
                }
              }}
              placeholder="Paste IPs, CIDR networks (192.168.1.0/24), or domain names separated by commas, spaces, or newlines..."
              className="min-h-[200px] font-mono text-sm"
              disabled={isProcessing}
            />
            <Components.Button
              variant="default"
              disabled={!bulkInput.trim() || isProcessing}
              onClick={handleBulkParse}
              className="w-full"
            >
              {isProcessing ? "Processing..." : "Parse and Add"}
            </Components.Button>
            <p className="text-xs text-muted-foreground">
              Supports comma, space, or newline-separated values. Domains will
              be added to scope even if they don't resolve. Press Ctrl+Enter (or
              Cmd+Enter on Mac) to parse and add.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staged Assets Slide-in Panel */}
      {stagedAssetsDrawerOpen && (
        <StagedAssetsPanel
          stagedAssets={stagedAssets}
          selectedAssetIds={selectedAssetIds}
          onAssetSelectionChange={setSelectedAssetIds}
          onAcceptAssets={handleAcceptAssets}
          onRejectAssets={handleRejectAssets}
          onClose={() => setStagedAssetsDrawerOpen(false)}
        />
      )}

      {/* Host Details Drawer */}
      <HostDetailsDrawer
        host={selectedHost}
        isOpen={hostDetailsDrawerOpen}
        onClose={() => {
          setHostDetailsDrawerOpen(false);
          setSelectedHost(null);
        }}
      />
    </div>
  );
};

// Sortable Table Header Component
const SortableTableHead = ({
  children,
  sortKey,
  currentSort,
  onSort,
  className = "",
}) => {
  const isSorted = currentSort?.key === sortKey;
  const direction = isSorted ? currentSort.direction : null;

  const handleClick = () => {
    onSort(sortKey);
  };

  return (
    <Components.TableHead
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
    </Components.TableHead>
  );
};

// Host Details Drawer Component
const HostDetailsDrawer = ({ host, isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!host) return null;

  const allDomains = host.domains?.filter((d) => d && d.name) || [];

  return (
    <div className={`fixed inset-0 z-50 flex ${isOpen ? "block" : "hidden"}`}>
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/50 transition-opacity duration-200"
        style={{ opacity: isVisible ? 0.5 : 0 }}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className="w-full max-w-2xl bg-white shadow-xl overflow-y-auto transition-transform duration-300 ease-out"
        style={{
          transform: isVisible ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-semibold">
              Host Details: {host.ip_address}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              All domains that resolve to this IP address
            </p>
          </div>
          <Components.Button variant="ghost" size="icon" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </Components.Button>
        </div>

        <div className="p-6 space-y-4">
          {/* Host Information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700">
                IP Address
              </label>
              <p className="font-mono text-sm">{host.ip_address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Total Domains
              </label>
              <p className="text-sm">{allDomains.length}</p>
            </div>
          </div>

          {/* Location Information */}
          {host.classification?.country && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700">
                Location
              </label>
              <p className="text-sm">
                {host.classification.city && host.classification.region
                  ? `${host.classification.city}, ${host.classification.region}`
                  : host.classification.city || host.classification.region}
                {host.classification.country && (
                  <span>, {host.classification.country}</span>
                )}
              </p>
            </div>
          )}

          {/* Classification Information */}
          {(host.classification?.org ||
            host.classification?.cloud_provider) && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700">
                Organization
              </label>
              <div className="space-y-1">
                {host.classification?.org && (
                  <Badge variant="outline" className="text-xs">
                    {host.classification.org}
                    {host.classification.asn &&
                      ` (ASN ${host.classification.asn})`}
                  </Badge>
                )}
                {host.classification?.cloud_provider?.provider && (
                  <Badge variant="secondary" className="text-xs">
                    {host.classification.cloud_provider.provider}
                    {host.classification.cloud_provider.service &&
                      ` (${host.classification.cloud_provider.service})`}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Domains List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Domains ({allDomains.length})
            </h3>

            {allDomains.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allDomains.map((domain, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🌐</span>
                      <span className="font-mono text-sm">{domain.name}</span>
                    </div>
                    <Components.Badge variant="secondary" className="text-xs">
                      Domain
                    </Components.Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                <p>No domains associated with this host.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Staged Assets Panel Component (using slide-in pattern from services table)
const StagedAssetsPanel = ({
  stagedAssets,
  selectedAssetIds,
  onAssetSelectionChange,
  onAcceptAssets,
  onRejectAssets,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sort, setSort] = useState({ key: "value", direction: "asc" });

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter assets based on search term
  const filteredAssets = useMemo(() => {
    if (!debouncedSearchTerm) return stagedAssets;

    const term = debouncedSearchTerm.toLowerCase();
    return stagedAssets.filter(
      (asset) =>
        asset.value.toLowerCase().includes(term) ||
        asset.tool.toLowerCase().includes(term) ||
        asset.type.toLowerCase().includes(term)
    );
  }, [stagedAssets, debouncedSearchTerm]);

  // Sort filtered assets
  const sortedAssets = useMemo(() => {
    if (!sort.key) return filteredAssets;

    return [...filteredAssets].sort((a, b) => {
      let aVal, bVal;

      switch (sort.key) {
        case "value":
          aVal = a.value || "";
          bVal = b.value || "";
          break;
        case "tool":
          aVal = a.tool || "";
          bVal = b.tool || "";
          break;
        case "confidence":
          aVal = Number(a.confidence) || 0;
          bVal = Number(b.confidence) || 0;
          return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
        case "type":
          aVal = a.type || "";
          bVal = b.type || "";
          break;
        default:
          return 0;
      }

      if (sort.key !== "confidence") {
        const result = aVal.localeCompare(bVal);
        return sort.direction === "asc" ? result : -result;
      }

      return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredAssets, sort]);

  // Get selected assets from filtered results
  const selectedFilteredAssets = sortedAssets.filter((asset) =>
    selectedAssetIds.includes(asset.id)
  );

  // Handle select all filtered
  const handleSelectAllFiltered = () => {
    const filteredIds = sortedAssets.map((asset) => asset.id);
    const allSelected = filteredIds.every((id) =>
      selectedAssetIds.includes(id)
    );

    if (allSelected) {
      // Deselect all filtered
      onAssetSelectionChange((currentSelected) =>
        currentSelected.filter((id) => !filteredIds.includes(id))
      );
    } else {
      // Select all filtered
      onAssetSelectionChange((currentSelected) => [
        ...new Set([...currentSelected, ...filteredIds]),
      ]);
    }
  };

  // Handle sort
  const handleSort = (key) => {
    setSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/50 transition-opacity duration-200"
        style={{ opacity: isVisible ? 0.5 : 0 }}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className="w-full max-w-6xl bg-white shadow-xl overflow-y-auto transition-transform duration-300 ease-out"
        style={{
          transform: isVisible ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-semibold">
              Staged Assets ({stagedAssets.length})
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Review and manage discovered assets before adding them to your
              project scope.
            </p>
          </div>
          <Components.Button variant="ghost" size="icon" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </Components.Button>
        </div>

        <div className="p-6 space-y-4">
          {/* Search/Filter */}
          {stagedAssets.length > 0 && (
            <div className="flex items-center gap-2">
              <Components.Input
                placeholder="Filter assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              {debouncedSearchTerm && filteredAssets.length > 0 && (
                <Components.Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFiltered}
                  title={
                    filteredAssets.every((asset) =>
                      selectedAssetIds.includes(asset.id)
                    )
                      ? `Deselect all ${filteredAssets.length} filtered assets`
                      : `Select all ${filteredAssets.length} filtered assets`
                  }
                >
                  {filteredAssets.every((asset) =>
                    selectedAssetIds.includes(asset.id)
                  )
                    ? `Deselect All (${filteredAssets.length})`
                    : `Select All Filtered (${filteredAssets.length})`}
                </Components.Button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {stagedAssets.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Components.Button
                  variant="destructive"
                  size="sm"
                  onClick={onRejectAssets}
                  disabled={selectedAssetIds.length === 0}
                >
                  Reject Selected ({selectedAssetIds.length})
                </Components.Button>
                <Components.Button
                  variant="default"
                  size="sm"
                  onClick={onAcceptAssets}
                  disabled={selectedAssetIds.length === 0}
                >
                  Add to Scope ({selectedAssetIds.length})
                </Components.Button>
              </div>
              <div className="text-sm text-gray-600">
                {selectedAssetIds.length} of {stagedAssets.length} selected
                {debouncedSearchTerm &&
                  filteredAssets.length !== stagedAssets.length && (
                    <span className="ml-2 text-blue-600">
                      ({filteredAssets.length} filtered)
                    </span>
                  )}
              </div>
            </div>
          )}

          {/* Assets Table */}
          <div className="max-h-96 overflow-auto border rounded-md">
            <Components.Table className="w-full">
              <Components.TableHeader>
                <Components.TableRow>
                  <Components.TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        sortedAssets.length > 0 &&
                        sortedAssets.every((asset) =>
                          selectedAssetIds.includes(asset.id)
                        )
                      }
                      onChange={handleSelectAllFiltered}
                      className="rounded"
                      title={
                        sortedAssets.every((asset) =>
                          selectedAssetIds.includes(asset.id)
                        )
                          ? `Deselect all ${sortedAssets.length} assets`
                          : `Select all ${sortedAssets.length} assets`
                      }
                    />
                  </Components.TableHead>
                  <SortableTableHead
                    sortKey="value"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Asset Value
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="tool"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Tool
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="confidence"
                    currentSort={sort}
                    onSort={handleSort}
                    className="text-right"
                  >
                    Confidence
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="type"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Type
                  </SortableTableHead>
                  <Components.TableHead>Location</Components.TableHead>
                  <Components.TableHead>Classification</Components.TableHead>
                </Components.TableRow>
              </Components.TableHeader>
              <Components.TableBody>
                {sortedAssets.map((asset) => (
                  <Components.TableRow
                    key={asset.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      onAssetSelectionChange((currentSelected) =>
                        selectedAssetIds.includes(asset.id)
                          ? currentSelected.filter((id) => id !== asset.id)
                          : [...currentSelected, asset.id]
                      )
                    }
                  >
                    <Components.TableCell>
                      <input
                        type="checkbox"
                        checked={selectedAssetIds.includes(asset.id)}
                        onChange={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    </Components.TableCell>
                    <Components.TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {asset.type === "domain"
                            ? "🌐"
                            : asset.type === "host"
                            ? "🖥️"
                            : "📄"}
                        </span>
                        {asset.value}
                      </div>
                    </Components.TableCell>
                    <Components.TableCell>{asset.tool}</Components.TableCell>
                    <Components.TableCell className="text-right">
                      <Badge
                        variant={
                          asset.confidence >= 80
                            ? "default"
                            : asset.confidence >= 60
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {asset.confidence}%
                      </Badge>
                    </Components.TableCell>
                    <Components.TableCell>
                      <Badge
                        className={
                          asset.type === "domain"
                            ? "bg-blue-100 text-blue-800"
                            : asset.type === "host"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {asset.type}
                      </Badge>
                    </Components.TableCell>
                    <Components.TableCell className="text-sm text-gray-600">
                      {asset.classification?.country ? (
                        <div className="text-xs">
                          <div className="font-medium">
                            {asset.classification.city &&
                            asset.classification.region
                              ? `${asset.classification.city}, ${asset.classification.region}`
                              : asset.classification.city ||
                                asset.classification.region}
                          </div>
                          <div className="text-muted-foreground">
                            {asset.classification.country}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Unknown
                        </span>
                      )}
                    </Components.TableCell>
                    <Components.TableCell>
                      <div className="space-y-1">
                        {asset.classification?.org && (
                          <Badge variant="outline" className="text-xs">
                            {asset.classification.org}
                            {asset.classification.asn &&
                              ` (ASN ${asset.classification.asn})`}
                          </Badge>
                        )}
                        {asset.classification?.cloud_provider?.provider && (
                          <Badge variant="secondary" className="text-xs">
                            {asset.classification.cloud_provider.provider}
                            {asset.classification.cloud_provider.service &&
                              ` (${asset.classification.cloud_provider.service})`}
                          </Badge>
                        )}
                        {!asset.classification?.org &&
                          !asset.classification?.cloud_provider?.provider && (
                            <span className="text-muted-foreground text-sm">
                              Unknown
                            </span>
                          )}
                      </div>
                    </Components.TableCell>
                  </Components.TableRow>
                ))}
              </Components.TableBody>
            </Components.Table>
          </div>

          {stagedAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No staged assets available.</p>
              <p className="text-sm">
                Run an AutoRecon scan to discover potential assets.
              </p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No assets match your filter.</p>
              <p className="text-sm">Try adjusting your search term.</p>
            </div>
          ) : null}

          <p className="text-xs text-gray-500 mt-4">
            Select subdomains above to add them to your project scope as
            domains. Only selected subdomains will be included.
          </p>
        </div>
      </div>
    </div>
  );
};

registerComponent("ProjectViewDetails", ProjectViewDetails);
export default ProjectViewDetails;
