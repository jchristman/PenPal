import React, { useEffect, useRef, useState, useMemo } from "react";
import { Components, registerComponent } from "@penpal/core";
import * as d3 from "d3";
import {
  ComputerDesktopIcon,
  ServerIcon,
  GlobeAltIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const { Card, CardContent, CardHeader, CardTitle, Badge, Button } = Components;

const ProjectViewHostsGraph = ({ hosts = [] }) => {
  const svgRef = useRef();
  const [selectedHost, setSelectedHost] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Prepare grid data organized by service count groups
  const gridData = useMemo(() => {
    const nodes = hosts.map((host) => ({
      id: host.id,
      ip_address: host.ip_address,
      hostnames: host.hostnames || [],
      os: host.os,
      mac_address: host.mac_address,
      serviceCount: host.servicesConnection?.totalCount || 0,
    }));

    // Group nodes by service count ranges
    const groups = {
      gray: nodes
        .filter((n) => n.serviceCount === 0)
        .sort((a, b) => a.ip_address.localeCompare(b.ip_address)),
      green: nodes
        .filter((n) => n.serviceCount >= 1 && n.serviceCount <= 5)
        .sort(
          (a, b) =>
            a.serviceCount - b.serviceCount ||
            a.ip_address.localeCompare(b.ip_address)
        ),
      yellow: nodes
        .filter((n) => n.serviceCount >= 6 && n.serviceCount <= 20)
        .sort(
          (a, b) =>
            a.serviceCount - b.serviceCount ||
            a.ip_address.localeCompare(b.ip_address)
        ),
      red: nodes
        .filter((n) => n.serviceCount > 20)
        .sort(
          (a, b) =>
            a.serviceCount - b.serviceCount ||
            a.ip_address.localeCompare(b.ip_address)
        ),
    };

    // Calculate grid positions for each group
    const { width, height } = dimensions;
    const padding = 60;
    const nodeSize = 100;
    const groupSpacing = 100;

    let currentY = padding;
    const positionedNodes = [];

    Object.entries(groups).forEach(([groupName, groupNodes]) => {
      if (groupNodes.length === 0) return;

      // Calculate grid dimensions for this group
      const availableWidth = width - padding * 2;
      const nodesPerRow = Math.max(1, Math.floor(availableWidth / nodeSize));
      const rows = Math.ceil(groupNodes.length / nodesPerRow);

      // Position nodes in grid
      groupNodes.forEach((node, index) => {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;

        // Center the row if it's not full
        const nodesInThisRow = Math.min(
          nodesPerRow,
          groupNodes.length - row * nodesPerRow
        );
        const rowStartX =
          padding + (availableWidth - nodesInThisRow * nodeSize) / 2;

        positionedNodes.push({
          ...node,
          x: rowStartX + col * nodeSize + nodeSize / 2,
          y: currentY + row * nodeSize + nodeSize / 2,
          group: groupName,
        });
      });

      currentY += rows * nodeSize + groupSpacing;
    });

    return { nodes: positionedNodes, groups };
  }, [hosts, dimensions]);

  useEffect(() => {
    if (!hosts.length) return;

    const container = svgRef.current?.parentNode;
    if (!container) return;

    const { clientWidth, clientHeight } = container;
    const width = clientWidth;
    const height = clientHeight;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    // Create zoom behavior
    const zoomContainer = svg.append("g").attr("class", "zoom-container");

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        zoomContainer.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Add group labels
    const groupInfo = [
      { name: "gray", label: "No Services (0)", color: "#94a3b8" },
      { name: "green", label: "Low Service Count (1-5)", color: "#22c55e" },
      {
        name: "yellow",
        label: "Medium Service Count (6-20)",
        color: "#f59e0b",
      },
      { name: "red", label: "High Service Count (20+)", color: "#ef4444" },
    ];

    let currentY = 60;
    groupInfo.forEach((groupInfo) => {
      const groupNodes = gridData.groups[groupInfo.name];
      if (groupNodes.length === 0) return;

      // Add group header
      zoomContainer
        .append("text")
        .attr("x", 60)
        .attr("y", currentY - 20)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", groupInfo.color)
        .text(`${groupInfo.label} (${groupNodes.length} hosts)`);

      // Calculate how many rows this group takes
      const nodeSize = 100;
      const availableWidth = width - 120;
      const nodesPerRow = Math.max(1, Math.floor(availableWidth / nodeSize));
      const rows = Math.ceil(groupNodes.length / nodesPerRow);

      currentY += rows * nodeSize + 100;
    });

    // Create nodes
    const node = zoomContainer
      .append("g")
      .selectAll("g")
      .data(gridData.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Node circles
    node
      .append("circle")
      .attr("class", "node-circle")
      .attr("r", 15)
      .attr("fill", (d) => {
        if (d.serviceCount === 0) return "#94a3b8"; // gray for no services
        if (d.serviceCount <= 5) return "#22c55e"; // green for few services
        if (d.serviceCount <= 20) return "#f59e0b"; // yellow for medium services
        return "#ef4444"; // red for many services
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Node labels (IP address)
    node
      .append("text")
      .text((d) => d.ip_address)
      .attr("x", 0)
      .attr("y", -25)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#374151");

    // Service count badges
    node
      .append("circle")
      .attr("r", 8)
      .attr("cx", 12)
      .attr("cy", -12)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    node
      .append("text")
      .text((d) => d.serviceCount)
      .attr("x", 12)
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .attr("fill", "#fff");

    // Click handler
    node.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedHost(d);
    });

    // Clear selection on background click
    svg.on("click", () => setSelectedHost(null));
  }, [gridData, dimensions]);

  useEffect(() => {
    d3.select(svgRef.current)
      .selectAll("circle.node-circle")
      .transition()
      .duration(200)
      .attr("stroke", (d) => (d.id === selectedHost?.id ? "#3b82f6" : "#fff"))
      .attr("stroke-width", (d) => (d.id === selectedHost?.id ? 4 : 2));
  }, [selectedHost]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentNode;
      if (container) {
        const { clientWidth, clientHeight } = container;
        setDimensions({
          width: clientWidth,
          height: clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!hosts.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hosts to display in graph view
      </div>
    );
  }

  return (
    <div className="h-full pb-8">
      <div className="relative h-full">
        {/* Graph Container */}
        <div className="absolute bg-gray-50 rounded-lg border h-full w-full">
          <svg ref={svgRef} className="w-full h-full rounded-lg" />

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md border z-10">
            <div className="text-sm font-medium mb-2">Service Count</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span>No services</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>1-5 services</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>6-20 services</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>20+ services</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-md border z-10">
            <div className="text-xs text-muted-foreground">
              Click nodes for details • Drag to pan • Scroll to zoom
            </div>
          </div>
        </div>

        {/* Detail Popup */}
        {selectedHost && (
          <div className="absolute top-4 left-4 w-80 z-10">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <ComputerDesktopIcon className="h-5 w-5" />
                  <span>{selectedHost.ip_address}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedHost(null)}
                  className="cursor-pointer"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Hostnames */}
                {selectedHost.hostnames.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">Hostnames</div>
                    <div className="space-y-1">
                      {selectedHost.hostnames.map((hostname, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <GlobeAltIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{hostname}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operating System */}
                {selectedHost.os?.name && (
                  <div>
                    <div className="text-sm font-medium mb-1">
                      Operating System
                    </div>
                    <Badge variant="outline">{selectedHost.os.name}</Badge>
                  </div>
                )}

                {/* MAC Address */}
                {selectedHost.mac_address && (
                  <div>
                    <div className="text-sm font-medium mb-1">MAC Address</div>
                    <span className="text-sm font-mono">
                      {selectedHost.mac_address}
                    </span>
                  </div>
                )}

                {/* Services */}
                <div>
                  <div className="text-sm font-medium mb-1">Services</div>
                  <div className="flex items-center space-x-2">
                    <ServerIcon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {selectedHost.serviceCount}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      services running
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

registerComponent("ProjectViewHostsGraph", ProjectViewHostsGraph);

export default ProjectViewHostsGraph;
