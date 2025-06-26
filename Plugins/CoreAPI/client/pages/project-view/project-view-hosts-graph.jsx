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

  // Prepare graph data
  const graphData = useMemo(() => {
    const nodes = hosts.map((host) => ({
      id: host.id,
      ip_address: host.ip_address,
      hostnames: host.hostnames || [],
      os: host.os,
      mac_address: host.mac_address,
      serviceCount: host.servicesConnection?.totalCount || 0,
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
    }));

    // Create links based on shared network characteristics
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // Link nodes in same subnet (simplified logic)
        const subnetA = nodeA.ip_address.split(".").slice(0, 3).join(".");
        const subnetB = nodeB.ip_address.split(".").slice(0, 3).join(".");

        if (subnetA === subnetB) {
          links.push({
            source: nodeA.id,
            target: nodeB.id,
            subnet: subnetA,
          });
        }
      }
    }

    return { nodes, links };
  }, [hosts, dimensions]);

  useEffect(() => {
    if (!hosts.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Create zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    const container = svg.append("g");

    // Create simulation
    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(25));

    // Create links
    const link = container
      .append("g")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    // Create nodes
    const node = container
      .append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Node circles
    node
      .append("circle")
      .attr("r", (d) => Math.max(8, Math.min(20, 8 + d.serviceCount * 0.5)))
      .attr("fill", (d) => {
        if (d.serviceCount === 0) return "#94a3b8"; // gray for no services
        if (d.serviceCount <= 5) return "#22c55e"; // green for few services
        if (d.serviceCount <= 20) return "#f59e0b"; // yellow for medium services
        return "#ef4444"; // red for many services
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Node labels
    node
      .append("text")
      .text((d) => d.ip_address)
      .attr("x", 0)
      .attr("y", -25)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#374151");

    // Service count badges
    node
      .append("circle")
      .attr("r", 8)
      .attr("cx", 15)
      .attr("cy", -15)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    node
      .append("text")
      .text((d) => d.serviceCount)
      .attr("x", 15)
      .attr("y", -11)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .attr("fill", "#fff");

    // Click handler
    node.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedHost(d);
    });

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Clear selection on background click
    svg.on("click", () => setSelectedHost(null));

    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentNode;
      if (container) {
        const { clientWidth, clientHeight } = container;
        setDimensions({
          width: Math.max(400, clientWidth - 32),
          height: Math.max(300, clientHeight - 100),
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
    <div className="relative h-full">
      {/* Graph Container */}
      <div
        className="relative bg-gray-50 rounded-lg border"
        style={{ height: dimensions.height + 40 }}
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="rounded-lg"
        />

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md border">
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
        <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-md border">
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
                  <Badge variant="secondary">{selectedHost.serviceCount}</Badge>
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
  );
};

registerComponent("ProjectViewHostsGraph", ProjectViewHostsGraph);

export default ProjectViewHostsGraph;
