import React, { useEffect, useRef, useState } from "react";
import { registerComponent, Components } from "@penpal/core";
import * as d3 from "d3";
import { X, Network, Server } from "lucide-react";

const { Card, CardContent, CardHeader, CardTitle, Button } = Components;

const ProjectViewNetworksGraph = ({ networks = [] }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!networks || networks.length === 0) return;

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

    const graph = { nodes: [], links: [] };

    networks.forEach((network) => {
      graph.nodes.push({ id: network.id, type: "network", data: network });
      if (network.hostsConnection?.hosts) {
        network.hostsConnection.hosts.forEach((host) => {
          // Add service count for coloration
          const serviceCount = host.servicesConnection?.totalCount || 0;
          graph.nodes.push({
            id: host.id,
            type: "host",
            data: { ...host, serviceCount },
            serviceCount,
          });
          graph.links.push({ source: network.id, target: host.id });
        });
      }
    });

    const simulation = d3
      .forceSimulation(graph.nodes)
      .force(
        "link",
        d3
          .forceLink(graph.links)
          .id((d) => d.id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide().radius((d) => (d.type === "network" ? 55 : 40))
      );

    // Create a container for zoom transforms
    const zoomContainer = svg.append("g").attr("class", "zoom-container");

    const link = zoomContainer
      .append("g")
      .attr("stroke", "#9ca3af")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graph.links)
      .join("line")
      .attr("stroke-width", 1.5);

    const node = zoomContainer
      .append("g")
      .selectAll("g")
      .data(graph.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(drag(simulation))
      .on("click", (event, d) => {
        setSelectedNode(d);
        event.stopPropagation();
      });

    node
      .append("circle")
      .attr("class", "node-circle")
      .attr("r", (d) => (d.type === "network" ? 20 : 15))
      .attr("fill", (d) => {
        if (d.type === "network") {
          return "#3b82f6"; // Blue for networks
        } else {
          // Color hosts based on service count (same as hosts graph)
          const serviceCount = d.serviceCount || 0;
          if (serviceCount === 0) return "#94a3b8"; // gray for no services
          if (serviceCount <= 5) return "#22c55e"; // green for few services
          if (serviceCount <= 20) return "#f59e0b"; // yellow for medium services
          return "#ef4444"; // red for many services
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add visible text labels positioned below the nodes
    node
      .append("text")
      .text((d) => {
        if (d.type === "network") {
          return d.data.subnet || "Unknown Network";
        } else {
          // For hosts, prefer hostname over IP, and truncate if too long
          const label =
            d.data.hostnames && d.data.hostnames.length > 0
              ? d.data.hostnames[0]
              : d.data.ip_address || "Unknown Host";
          // Truncate long labels - ensure label is a string
          const labelStr = String(label || "");
          return labelStr.length > 12
            ? labelStr.substring(0, 12) + "..."
            : labelStr;
        }
      })
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.type === "network" ? "40" : "30")) // Position below the circle
      .attr("font-size", (d) => (d.type === "network" ? "14px" : "12px")) // Increased from 11px/9px
      .attr("font-weight", "bold") // Made all text bold
      .attr("fill", "#374151") // Dark gray text
      .attr("pointer-events", "none") // Prevent text from interfering with node interactions
      .style("user-select", "none");

    // Add service count badges to host nodes
    const hostNodes = node.filter((d) => d.type === "host");

    hostNodes
      .append("circle")
      .attr("r", 8)
      .attr("cx", 12)
      .attr("cy", -12)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    hostNodes
      .append("text")
      .text((d) => d.serviceCount)
      .attr("x", 12)
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .attr("fill", "#fff");

    node
      .append("title")
      .text((d) => (d.type === "network" ? d.data.subnet : d.data.ip_address));

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    const zoom = d3.zoom().on("zoom", (event) => {
      zoomContainer.attr("transform", event.transform);
    });
    svg.call(zoom);

    // Clear selection on background click
    svg.on("click", () => setSelectedNode(null));

    return () => {
      simulation.stop();
    };
  }, [networks, dimensions]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Trigger re-render by updating dimensions state
      const container = svgRef.current?.parentNode;
      if (container) {
        const { clientWidth, clientHeight } = container;
        setDimensions({
          width: clientWidth,
          height: clientHeight - 800,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    d3.select(svgRef.current)
      .selectAll("circle.node-circle")
      .transition()
      .duration(200)
      .attr("stroke", (d) => (d.id === selectedNode?.id ? "#2563eb" : "#fff"))
      .attr("stroke-width", (d) => (d.id === selectedNode?.id ? 4 : 2));
  }, [selectedNode]);

  const drag = (simulation) => {
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
    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  if (!networks.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No networks to display in graph view
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
            <div className="text-sm font-medium mb-2">Attack Surface</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span>Networks</span>
              </div>
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
              Click nodes for details • Drag to move • Scroll to zoom • Pan to
              navigate
            </div>
          </div>
        </div>

        {/* Detail Popup */}
        {selectedNode && (
          <div className="absolute top-4 left-4 w-80 z-10">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  {selectedNode.type === "network" ? (
                    <>
                      <Network className="h-4 w-4" />
                      <span>Network Details</span>
                    </>
                  ) : (
                    <>
                      <Server className="h-4 w-4" />
                      <span>Host Details</span>
                    </>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNode(null)}
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {selectedNode.type === "network" && (
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium">Subnet</div>
                      <div className="font-bold">
                        {selectedNode.data.subnet}
                      </div>
                    </div>
                    {selectedNode.data.domain && (
                      <div>
                        <div className="text-sm font-medium">Domain</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedNode.data.domain}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium">Hosts</div>
                      <div className="text-sm">
                        {selectedNode.data.hostsConnection?.totalCount || 0}{" "}
                        hosts discovered
                      </div>
                    </div>
                  </div>
                )}
                {selectedNode.type === "host" && (
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium">IP Address</div>
                      <div className="font-bold">
                        {selectedNode.data.ip_address}
                      </div>
                    </div>
                    {selectedNode.data.hostnames?.length > 0 && (
                      <div>
                        <div className="text-sm font-medium">Hostnames</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedNode.data.hostnames.join(", ")}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium">Services</div>
                      <div className="text-sm">
                        {selectedNode.data.servicesConnection?.totalCount || 0}{" "}
                        services running
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

registerComponent("ProjectViewNetworksGraph", ProjectViewNetworksGraph);
export default ProjectViewNetworksGraph;
