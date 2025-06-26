import React, { useEffect, useRef, useState } from "react";
import { registerComponent, Components } from "@penpal/core";
import * as d3 from "d3";
import { X, Network, Server } from "lucide-react";

const { Card, CardContent, CardHeader, CardTitle, Button } = Components;

const ProjectViewNetworksGraph = ({ networks = [] }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!networks || networks.length === 0) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);
    svg.selectAll("*").remove();

    const graph = { nodes: [], links: [] };

    networks.forEach((network) => {
      graph.nodes.push({ id: network.id, type: "network", data: network });
      if (network.hostsConnection?.hosts) {
        network.hostsConnection.hosts.forEach((host) => {
          graph.nodes.push({ id: host.id, type: "host", data: host });
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
          .distance(50)
      )
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide().radius((d) => (d.type === "network" ? 25 : 15))
      );

    const link = svg
      .append("g")
      .attr("stroke", "#9ca3af")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graph.links)
      .join("line")
      .attr("stroke-width", 1.5);

    const node = svg
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
      .attr("r", (d) => (d.type === "network" ? 20 : 10))
      .attr("fill", (d) => (d.type === "network" ? "#3b82f6" : "#10b981"));

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
      svg.selectAll("g").attr("transform", event.transform);
    });
    svg.call(zoom);

    const handleResize = () => {
      const { width, height } = container.getBoundingClientRect();
      svg.attr("viewBox", [0, 0, width, height]);
      simulation
        .force("center", d3.forceCenter(width / 2, height / 2))
        .restart();
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [networks]);

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

  return (
    <div className="relative h-[600px] w-full" ref={containerRef}>
      <svg ref={svgRef} className="h-full w-full"></svg>
      {selectedNode && (
        <Card className="absolute top-4 right-4 w-80 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedNode.type === "network"
                ? "Network Details"
                : "Host Details"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNode(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {selectedNode.type === "network" && (
              <div>
                <div className="font-bold">{selectedNode.data.subnet}</div>
                {selectedNode.data.domain && (
                  <div className="text-sm text-muted-foreground">
                    {selectedNode.data.domain}
                  </div>
                )}
                <div className="text-sm mt-2">
                  Hosts: {selectedNode.data.hostsConnection?.totalCount || 0}
                </div>
              </div>
            )}
            {selectedNode.type === "host" && (
              <div>
                <div className="font-bold">{selectedNode.data.ip_address}</div>
                {selectedNode.data.hostnames?.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedNode.data.hostnames.join(", ")}
                  </div>
                )}
                <div className="text-sm mt-2">
                  Services:{" "}
                  {selectedNode.data.servicesConnection?.totalCount || 0}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

registerComponent("ProjectViewNetworksGraph", ProjectViewNetworksGraph);
export default ProjectViewNetworksGraph;
