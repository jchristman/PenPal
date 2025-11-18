import React, { useState } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";
import { useQuery, useMutation } from "@apollo/client";
import GetNetworksInformation from "./queries/get-networks-information.js";
import GetHostsInformation from "./queries/get-hosts-information.js";
import { parseScopeInput } from "../projects/scope-parser.js";
import gql from "graphql-tag";

const { useToast } = Hooks;

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
      hostnames
    }
  }
`;

const CREATE_HOSTS_FROM_DOMAINS = gql`
  mutation CreateHostsFromDomains($projectID: ID!, $domains: [String!]!) {
    createHostsFromDomains(projectID: $projectID, domains: $domains) {
      id
      ip_address
      hostnames
    }
  }
`;

const REMOVE_HOSTS = gql`
  mutation RemoveHosts($ids: [ID!]!) {
    removeHosts(ids: $ids)
  }
`;

const ProjectViewDetails = ({ project, disable_polling }) => {
  const { toast } = useToast();

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
  const [createHostsFromDomains] = useMutation(CREATE_HOSTS_FROM_DOMAINS, {
    onCompleted: () => {
      refetchHosts();
    },
  });
  const [removeHosts] = useMutation(REMOVE_HOSTS);

  const networks =
    networksData?.getProject?.scope?.networksConnection?.networks || [];
  const hosts = hostsData?.getHostsByProjectID || [];

  const [bulkInput, setBulkInput] = useState("");
  const [selectedNetworkIds, setSelectedNetworkIds] = useState([]);
  const [selectedHostIds, setSelectedHostIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
              ip_address: ip 
            })),
          },
        });
      }

      // Add domains (will be resolved server-side)
      const existingDomains = new Set();
      hosts.forEach((h) => {
        if (h.hostnames) {
          h.hostnames.forEach((hn) => existingDomains.add(hn));
        }
      });
      const newDomains = parsed.domains.filter(
        (domain) => !existingDomains.has(domain)
      );
      if (newDomains.length > 0) {
        await createHostsFromDomains({
          variables: {
            projectID: project.id,
            domains: newDomains,
          },
        });
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

  return (
    <div className="p-6 space-y-6">
      <Components.Card>
        <Components.CardHeader>
          <Components.CardTitle>Project Scope</Components.CardTitle>
          <Components.CardDescription>
            View and edit networks and independent hosts in scope
          </Components.CardDescription>
        </Components.CardHeader>
        <Components.CardContent className="space-y-6">
          {/* Bulk Paste Section */}
          <div>
            <Components.Label htmlFor="bulk-input">
              Add Scope Items (IPs, Networks, Domains)
            </Components.Label>
            <div className="flex flex-col space-y-2 mt-2">
              <Components.Textarea
                id="bulk-input"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                onKeyDown={(e) => {
                  // Trigger parse on Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    if (bulkInput.trim() && !isProcessing) {
                      handleBulkParse();
                    }
                  }
                }}
                placeholder="Paste IPs, CIDR networks (192.168.1.0/24), or domain names separated by commas, spaces, or newlines..."
                className="min-h-[100px] font-mono text-sm"
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
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Supports comma, space, or newline-separated values. Domains will be
              resolved to IPs automatically. Press Ctrl+Enter (or Cmd+Enter on Mac) to parse and add.
            </p>
          </div>

          {/* Combined Scope Display */}
          <div className="space-y-4">
            {/* Networks Section */}
            {networks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Networks</h3>
                  <Components.Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveNetworks}
                    disabled={selectedNetworkIds.length === 0}
                  >
                    Remove Selected ({selectedNetworkIds.length})
                  </Components.Button>
                </div>
                <div className="border rounded-md divide-y max-h-80 overflow-auto">
                  {networks.map((n) => (
                    <label
                      key={n.id}
                      className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/30"
                    >
                      <Components.Checkbox
                        checked={selectedNetworkIds.includes(n.id)}
                        onCheckedChange={(c) =>
                          setSelectedNetworkIds((prev) =>
                            c
                              ? [...prev, n.id]
                              : prev.filter((id) => id !== n.id)
                          )
                        }
                      />
                      <div className="text-sm flex-1">
                        <div className="font-medium">{`${n.subnet}`}</div>
                        {n.domain && (
                          <div className="text-muted-foreground text-xs">
                            Domain: {n.domain}
                          </div>
                        )}
                      </div>
                      <Components.Badge variant="outline">
                        {n.hostsConnection?.totalCount ?? 0} hosts
                      </Components.Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Hosts Section */}
            {hosts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Independent Hosts</h3>
                  <Components.Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveHosts}
                    disabled={selectedHostIds.length === 0}
                  >
                    Remove Selected ({selectedHostIds.length})
                  </Components.Button>
                </div>
                <div className="border rounded-md divide-y max-h-80 overflow-auto">
                  {hosts.map((h) => (
                    <label
                      key={h.id}
                      className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/30"
                    >
                      <Components.Checkbox
                        checked={selectedHostIds.includes(h.id)}
                        onCheckedChange={(c) =>
                          setSelectedHostIds((prev) =>
                            c
                              ? [...prev, h.id]
                              : prev.filter((id) => id !== h.id)
                          )
                        }
                      />
                      <div className="text-sm flex-1 min-w-0">
                        <div className="font-medium">{h.ip_address}</div>
                        {(() => {
                          const hostnames = Array.isArray(h.hostnames) ? h.hostnames : [];
                          return hostnames.length > 0 ? (
                            <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                              <span className="text-xs text-muted-foreground font-medium">Domains:</span>
                              {hostnames.map((hostname, idx) => (
                                <Components.Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {hostname}
                                </Components.Badge>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Components.Badge variant="outline">
                          {h.servicesConnection?.totalCount ?? 0} services
                        </Components.Badge>
                        {h.vulnerabilitiesConnection?.totalCount > 0 && (
                          <Components.Badge variant="destructive">
                            {h.vulnerabilitiesConnection?.totalCount} vulns
                          </Components.Badge>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {networks.length === 0 && hosts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No scope items added yet. Use the bulk paste field above to add
                IPs, networks, or domains.
              </div>
            )}
          </div>
        </Components.CardContent>
      </Components.Card>
    </div>
  );
};

registerComponent("ProjectViewDetails", ProjectViewDetails);
export default ProjectViewDetails;
