import React, { useEffect, useRef, useState, useMemo } from "react";
import { Components, registerComponent } from "@penpal/core";
import * as d3 from "d3";
import {
  GlobeAltIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const { Card, CardContent, CardHeader, CardTitle, Badge, Button } = Components;

const ProjectViewDomainsGraph = ({ domains = [] }) => {
  const svgRef = useRef();
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Prepare grid data organized by resolution status
  const gridData = useMemo(() => {
    const nodes = domains.map((domain) => ({
      id: domain.id,
      name: domain.name,
      resolved_ips: domain.resolved_ips || [],
      ipCount: domain.resolved_ips?.length || 0,
      hasResolution: (domain.resolved_ips?.length || 0) > 0,
      tld: domain.name?.split('.').pop() || 'unknown',
    }));

    // Group nodes by resolution status
    const groups = {
      resolved: nodes
        .filter((n) => n.hasResolution)
        .sort((a, b) => b.ipCount - a.ipCount || a.name.localeCompare(b.name)),
      unresolved: nodes
        .filter((n) => !n.hasResolution)
        .sort((a, b) => a.name.localeCompare(b.name)),
    };

    // Calculate grid positions for each group
    const { width, height } = dimensions;
    const padding = 60;
    const nodeSize = 120;
    const groupSpacing = 120;

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
  }, [domains, dimensions]);

  useEffect(() => {
    if (!domains.length) return;

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
      { name: "resolved", label: "Resolved Domains", color: "#22c55e" },
      { name: "unresolved", label: "Unresolved Domains", color: "#ef4444" },
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
        .text(`${groupInfo.label} (${groupNodes.length} domains)`);

      // Calculate how many rows this group takes
      const nodeSize = 120;
      const availableWidth = width - 120;
      const nodesPerRow = Math.max(1, Math.floor(availableWidth / nodeSize));
      const rows = Math.ceil(groupNodes.length / nodesPerRow);

      currentY += rows * nodeSize + 120;
    });

    // Create nodes
    const node = zoomContainer
      .append("g")
      .selectAll("g")
      .data(gridData.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Node rectangles (larger for domain names)
    node
      .append("rect")
      .attr("class", "node-rect")
      .attr("x", -50)
      .attr("y", -25)
      .attr("width", 100)
      .attr("height", 50)
      .attr("rx", 8)
      .attr("fill", (d) => (d.hasResolution ? "#dcfce7" : "#fef2f2"))
      .attr("stroke", (d) => (d.hasResolution ? "#22c55e" : "#ef4444"))
      .attr("stroke-width", 2);

    // Domain name labels
    node
      .append("text")
      .text((d) => {
        const name = d.name;
        // Truncate long domain names
        return name.length > 15 ? name.substring(0, 12) + "..." : name;
      })
      .attr("x", 0)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "#374151");

    // IP count badges
    node
      .append("circle")
      .attr("r", 8)
      .attr("cx", 35)
      .attr("cy", -15)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    node
      .append("text")
      .text((d) => d.ipCount)
      .attr("x", 35)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .attr("fill", "#fff");

    // Click handler
    node.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedDomain(d);
    });

    // Clear selection on background click
    svg.on("click", () => setSelectedDomain(null));
  }, [gridData, dimensions]);

  useEffect(() => {
    d3.select(svgRef.current)
      .selectAll("rect.node-rect")
      .transition()
      .duration(200)
      .attr("stroke-width", (d) => (d.id === selectedDomain?.id ? 4 : 2));
  }, [selectedDomain]);

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

  if (!domains.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No domains to display in graph view
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
            <div className="text-sm font-medium mb-2">Domain Status</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-500"></div>
                <span>Resolved</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-red-100 border border-red-500"></div>
                <span>Unresolved</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>IP Count</span>
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
        {selectedDomain && (
          <div className="absolute top-4 left-4 w-80 z-10">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <GlobeAltIcon className="h-5 w-5" />
                  <span className="break-all">{selectedDomain.name}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedDomain(null)}
                  className="cursor-pointer"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Resolution Status */}
                <div>
                  <div className="text-sm font-medium mb-1">Resolution Status</div>
                  <div className="flex items-center space-x-2">
                    {selectedDomain.hasResolution ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        <Badge variant="outline" className="text-green-600">
                          Resolved
                        </Badge>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">No Resolution</Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* TLD */}
                <div>
                  <div className="text-sm font-medium mb-1">Top-Level Domain</div>
                  <Badge variant="outline">.{selectedDomain.tld}</Badge>
                </div>

                {/* Resolved IPs */}
                {selectedDomain.resolved_ips?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">Resolved IP Addresses</div>
                    <div className="space-y-1">
                      {selectedDomain.resolved_ips.map((ip, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <ServerIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-mono">{ip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* IP Count Summary */}
                <div>
                  <div className="text-sm font-medium mb-1">Summary</div>
                  <div className="flex items-center space-x-2">
                    <ServerIcon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {selectedDomain.ipCount}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      IP address{selectedDomain.ipCount !== 1 ? 'es' : ''} resolved
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

registerComponent("ProjectViewDomainsGraph", ProjectViewDomainsGraph);

export default ProjectViewDomainsGraph;
