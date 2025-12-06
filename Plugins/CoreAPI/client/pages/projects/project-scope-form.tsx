import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { parseScopeInput } from "./scope-parser.ts";

const { Label, Button, Badge, Textarea } = Components;

interface ProjectScopeFormProps {
  projectIPs: string[];
  setProjectIPs: (ips: string[]) => void;
  projectNetworks: string[];
  setProjectNetworks: (networks: string[]) => void;
  projectDomains: string[];
  setProjectDomains: (domains: string[]) => void;
}

const ProjectScopeForm = ({
  projectIPs,
  setProjectIPs,
  projectNetworks,
  setProjectNetworks,
  projectDomains,
  setProjectDomains,
}: ProjectScopeFormProps) => {
  const [bulkInput, setBulkInput] = useState("");

  const handleRemoveHost = (ip: string) =>
    setProjectIPs(projectIPs.filter((_ip: string) => _ip !== ip));

  const handleRemoveNetwork = (_network: string) =>
    setProjectNetworks(
      projectNetworks.filter((__network: string) => __network !== _network)
    );

  const handleRemoveDomain = (domain: string) =>
    setProjectDomains(projectDomains.filter((_domain: string) => _domain !== domain));

  const handleBulkParse = () => {
    const parsed = parseScopeInput(bulkInput);
    
    // Add unique IPs
    const newIPs = parsed.ips.filter((ip) => !projectIPs.includes(ip));
    if (newIPs.length > 0) {
      setProjectIPs([...projectIPs, ...newIPs]);
    }

    // Add unique networks
    const newNetworks = parsed.networks.filter(
      (net) => !projectNetworks.includes(net)
    );
    if (newNetworks.length > 0) {
      setProjectNetworks([...projectNetworks, ...newNetworks]);
    }

    // Add unique domains
    const newDomains = parsed.domains.filter(
      (domain) => !projectDomains.includes(domain)
    );
    if (newDomains.length > 0) {
      setProjectDomains([...projectDomains, ...newDomains]);
    }

    // Clear bulk input after parsing
    setBulkInput("");
  };

  const bulkInput_has_content = bulkInput.trim().length > 0;
  const hasAnyScope = projectIPs.length > 0 || projectNetworks.length > 0 || (projectDomains && projectDomains.length > 0);

  return (
    <div className="flex flex-col justify-start items-start h-full w-full space-y-4">
      {/* Bulk Paste Section */}
      <div className="w-full">
        <Label htmlFor="bulk-input">
          Scope (IPs, Networks, Domains)
        </Label>
        <div className="flex flex-col space-y-2">
          <Textarea
            id="bulk-input"
            value={bulkInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkInput(e.target.value)}
            placeholder="Paste IPs, CIDR networks (192.168.1.0/24), or domain names separated by commas, spaces, or newlines..."
            className="min-h-[100px] font-mono text-sm"
          />
          <Button
            variant="default"
            disabled={!bulkInput_has_content}
            onClick={handleBulkParse}
            className="w-full"
          >
            Parse and Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Supports comma, space, or newline-separated values. Domains will be
          resolved to IPs when creating the project.
        </p>
      </div>

      {/* Combined Scope Display */}
      <div className="w-full">
        <Label>Parsed Scope Items</Label>
        <div className="flex flex-wrap border border-gray-400 w-full rounded-lg p-2 min-h-[60px] text-gray-700">
          {!hasAnyScope ? (
            <div className="mt-2 text-muted-foreground">No scope items added yet</div>
          ) : (
            <>
              {/* IP Addresses */}
              {projectIPs.map((ip) => (
                <Badge
                  key={`ip-${ip}`}
                  variant="secondary"
                  className="mt-2 mr-2 pl-2 pr-1 py-1 flex items-center"
                >
                  <span className="text-xs text-muted-foreground mr-1">IP:</span>
                  {ip}
                  <button
                    onClick={() => handleRemoveHost(ip)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              {/* Networks */}
              {projectNetworks.map((_network) => (
                <Badge
                  key={`net-${_network}`}
                  variant="secondary"
                  className="mt-2 mr-2 pl-2 pr-1 py-1 flex items-center"
                >
                  <span className="text-xs text-muted-foreground mr-1">NET:</span>
                  {_network}
                  <button
                    onClick={() => handleRemoveNetwork(_network)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              {/* Domains */}
              {projectDomains && projectDomains.map((domain) => (
                <Badge
                  key={`domain-${domain}`}
                  variant="outline"
                  className="mt-2 mr-2 pl-2 pr-1 py-1 flex items-center"
                >
                  <span className="text-xs text-muted-foreground mr-1">DOMAIN:</span>
                  {domain}
                  <button
                    onClick={() => handleRemoveDomain(domain)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

registerComponent("ProjectScopeForm", ProjectScopeForm);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectScopeForm;
