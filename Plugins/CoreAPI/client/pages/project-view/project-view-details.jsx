import React, { useMemo, useState } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";
import { useQuery, useMutation } from "@apollo/client";
import GetNetworksInformation from "./queries/get-networks-information.js";
import GetHostsInformation from "./queries/get-hosts-information.js";
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
      // Force refresh of networks view after creating
      refetchNetworks();
    },
  });
  const [removeNetworks] = useMutation(REMOVE_NETWORKS);
  const [createHosts] = useMutation(CREATE_HOSTS);
  const [removeHosts] = useMutation(REMOVE_HOSTS);

  const networks =
    networksData?.getProject?.scope?.networksConnection?.networks || [];
  const hosts = hostsData?.getHostsByProjectID || [];

  const [newSubnet, setNewSubnet] = useState("");
  const [newHost, setNewHost] = useState("");
  const [selectedNetworkIds, setSelectedNetworkIds] = useState([]);
  const [selectedHostIds, setSelectedHostIds] = useState([]);

  const handleAddSubnet = async () => {
    if (!newSubnet.trim()) return;
    try {
      await createNetworks({
        variables: { project: project.id, subnets: [newSubnet.trim()] },
      });
      setNewSubnet("");
      await refetchNetworks();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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

  const handleAddHost = async () => {
    if (!newHost.trim()) return;
    try {
      await createHosts({
        variables: {
          projectID: project.id,
          hosts: [{ ip_address: newHost.trim() }],
        },
      });
      setNewHost("");
      refetchHosts();
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
        <Components.CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Networks</h3>
              <div className="flex gap-2 mb-3">
                <Components.Input
                  placeholder="e.g. 10.0.0.0/24"
                  value={newSubnet}
                  onChange={(e) => setNewSubnet(e.target.value)}
                />
                <Components.Button onClick={handleAddSubnet}>
                  Add
                </Components.Button>
                <Components.Button
                  variant="destructive"
                  onClick={handleRemoveNetworks}
                  disabled={selectedNetworkIds.length === 0}
                >
                  Remove Selected
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
                          c ? [...prev, n.id] : prev.filter((id) => id !== n.id)
                        )
                      }
                    />
                    <div className="text-sm">
                      <div className="font-medium">{`${n.subnet}`}</div>
                      {n.domain && (
                        <div className="text-muted-foreground">{n.domain}</div>
                      )}
                    </div>
                    <div className="flex-1" />
                    <Components.Badge variant="outline">
                      {n.hostsConnection?.totalCount ?? 0} hosts
                    </Components.Badge>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Independent Hosts</h3>
              <div className="flex gap-2 mb-3">
                <Components.Input
                  placeholder="e.g. 10.0.0.1"
                  value={newHost}
                  onChange={(e) => setNewHost(e.target.value)}
                />
                <Components.Button onClick={handleAddHost}>
                  Add
                </Components.Button>
                <Components.Button
                  variant="destructive"
                  onClick={handleRemoveHosts}
                  disabled={selectedHostIds.length === 0}
                >
                  Remove Selected
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
                          c ? [...prev, h.id] : prev.filter((id) => id !== h.id)
                        )
                      }
                    />
                    <div className="text-sm">
                      <div className="font-medium">{h.ip_address}</div>
                      {h.hostnames?.length > 0 && (
                        <div className="text-muted-foreground truncate max-w-xs">
                          {h.hostnames.join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                    <Components.Badge variant="outline">
                      {h.servicesConnection?.totalCount ?? 0} services
                    </Components.Badge>
                      {h.vulnerabilitiesConnection?.totalCount > 0 && (
                        <Components.Badge variant="destructive">
                          {h.vulnerabilitiesConnection?.totalCount} vulnerabilities
                        </Components.Badge>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Components.CardContent>
      </Components.Card>
    </div>
  );
};

registerComponent("ProjectViewDetails", ProjectViewDetails);
export default ProjectViewDetails;
