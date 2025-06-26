import React, { useState } from "react";
import { Components, registerComponent, Regex, Utils } from "@penpal/core";
import _ from "lodash";
import { XMarkIcon } from "@heroicons/react/24/outline";

const { cn } = Utils;
const { Input, Label, Button, Badge, Separator } = Components;

const ProjectScopeForm = ({
  projectIPs,
  setProjectIPs,
  projectNetworks,
  setProjectNetworks,
}) => {
  const [host, setHost] = useState("");
  const [network, setNetwork] = useState("");
  const [subnetMask, setSubnetMask] = useState(24);

  const handleHostChange = (event) => setHost(event.target.value);
  const handleNetworkChange = (event) => setNetwork(event.target.value);
  const handleSubnetMaskChange = (event) => setSubnetMask(event.target.value);

  const handleAddHost = () => {
    const newProjectIPs = [host].concat(projectIPs);
    setProjectIPs(newProjectIPs);
    setHost("");
  };

  const handleRemoveHost = (ip) =>
    setProjectIPs(projectIPs.filter((_ip) => _ip !== ip));

  const handleAddNetwork = () => {
    const newProjectNetworks = [`${network}/${subnetMask}`].concat(
      projectNetworks
    );

    setProjectNetworks(newProjectNetworks);
    setNetwork("");
    setSubnetMask(24);
  };

  const handleRemoveNetwork = (_network) =>
    setProjectNetworks(
      projectNetworks.filter((__network) => __network !== _network)
    );

  const host_is_valid =
    Regex.ip_address.test(host) && !_.includes(projectIPs, host);
  const host_error = host.length > 0 && !host_is_valid;
  const network_is_valid =
    Regex.ip_address.test(network) &&
    !_.includes(projectNetworks, `${network}/${subnetMask}`);
  const network_error = network.length > 0 && !network_is_valid;
  const mask_error =
    0 > subnetMask || 32 < subnetMask || subnetMask.length === 0;

  return (
    <div className="flex flex-col justify-center items-start h-full w-full">
      {/* Host/IP Section */}
      <div className="flex flex-row items-baseline justify-start mb-2 w-full">
        <div className="mr-2 flex-1">
          <Label htmlFor="ip-address">IP Address</Label>
          <Input
            id="ip-address"
            value={host}
            onChange={handleHostChange}
            className={cn(
              "w-full",
              host_error && "border-red-500 focus:border-red-500"
            )}
          />
          {host_error && (
            <p className="text-sm text-red-500 mt-1">
              {Regex.ip_address.test(host) ? "IP already added" : "Invalid IP"}
            </p>
          )}
        </div>
        <Button
          variant="default"
          disabled={host.length === 0 || !host_is_valid}
          onClick={handleAddHost}
          className="mt-6"
        >
          Add Host
        </Button>
      </div>

      {/* Host Scope Display */}
      <div className="flex flex-wrap border border-gray-400 w-full rounded-lg p-2 min-h-[60px] text-gray-700">
        {projectIPs.length === 0 ? (
          <div className="mt-2">No Hosts Provided</div>
        ) : (
          projectIPs.map((ip) => (
            <Badge
              key={ip}
              variant="secondary"
              className="mt-2 mr-2 pl-2 pr-1 py-1 flex items-center"
            >
              {ip}
              <button
                onClick={() => handleRemoveHost(ip)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      <Separator className="w-[70%] mx-[15%] my-8" />

      {/* Network Section */}
      <div className="flex flex-row items-baseline justify-start mb-2 w-full">
        <div className="mr-2 flex-1">
          <Label htmlFor="network-address">Network Address</Label>
          <Input
            id="network-address"
            value={network}
            onChange={handleNetworkChange}
            className={cn(
              "w-full",
              network_error && "border-red-500 focus:border-red-500"
            )}
          />
          {network_error && (
            <p className="text-sm text-red-500 mt-1">
              {Regex.ip_address.test(network)
                ? "Network already added"
                : "Invalid IP"}
            </p>
          )}
        </div>
        <div className="flex items-center mt-6">
          <span className="mx-2">/</span>
          <div className="w-16">
            <Input
              value={subnetMask}
              onChange={handleSubnetMaskChange}
              className={cn(
                "w-full text-center",
                mask_error && "border-red-500 focus:border-red-500"
              )}
            />
          </div>
        </div>
        <Button
          variant="default"
          disabled={network.length === 0 || mask_error || network_error}
          onClick={handleAddNetwork}
          className="mt-6 ml-2"
        >
          Add Network
        </Button>
      </div>

      {/* Network Scope Display */}
      <div className="flex flex-wrap border border-gray-400 w-full rounded-lg p-2 min-h-[60px] text-gray-700">
        {projectNetworks.length === 0 ? (
          <div className="mt-2">No Networks Provided</div>
        ) : (
          projectNetworks.map((_network) => (
            <Badge
              key={_network}
              variant="secondary"
              className="mt-2 mr-2 pl-2 pr-1 py-1 flex items-center"
            >
              {_network}
              <button
                onClick={() => handleRemoveNetwork(_network)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
};

registerComponent("ProjectScopeForm", ProjectScopeForm);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectScopeForm;
