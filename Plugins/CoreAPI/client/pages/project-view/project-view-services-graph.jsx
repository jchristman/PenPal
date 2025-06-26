import React, { useRef, useEffect, useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import * as d3 from "d3";
import {
  ComputerDesktopIcon,
  ServerIcon,
  XMarkIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const { Card, CardContent, CardHeader, CardTitle, Badge, Button } = Components;

const ProjectViewServicesGraph = ({ services = [] }) => {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Process data for D3
  const graphData = React.useMemo(() => {
    const nodes = [];
    const links = [];
    const hostMap = new Map();

    // Group services by host
    services.forEach((service) => {
      const hostIp = service.host?.ip_address || "Unknown";
      if (!hostMap.has(hostIp)) {
        hostMap.set(hostIp, {
          id: `host-${hostIp}`,
          type: "host",
          ip: hostIp,
          services: [],
        });
      }
      hostMap.get(hostIp).services.push(service);
    });

    // Create host nodes
    hostMap.forEach((hostData, hostIp) => {
      nodes.push({
        id: hostData.id,
        type: "host",
        ip: hostIp,
        services: hostData.services,
        serviceCount: hostData.services.length,
        openServices: hostData.services.filter((s) => s.status === "open")
          .length,
        enrichedServices: hostData.services.filter(
          (s) => s.enrichments?.length > 0
        ).length,
      });

      // Create service nodes and links
      hostData.services.forEach((service) => {
        const serviceNodeId = `service-${
          service.id || `${hostIp}-${service.port}`
        }`;

        nodes.push({
          id: serviceNodeId,
          type: "service",
          service: service,
          hostIp: hostIp,
          port: service.port,
          protocol: service.ip_protocol,
          status: service.status,
          enrichments: service.enrichments || [],
        });

        links.push({
          source: hostData.id,
          target: serviceNodeId,
          type: "host-service",
        });
      });
    });

    return { nodes, links };
  }, [services]);

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Create zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    const container = svg.append("g");

    // Create force simulation
    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => (d.type === "host" ? 40 : 25))
      );

    // Create links
    const link = container
      .append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    // Create node groups
    const node = container
      .append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Add circles for nodes
    node
      .append("circle")
      .attr("r", (d) => (d.type === "host" ? 30 : 20))
      .attr("fill", (d) => {
        if (d.type === "host") {
          // Color based on service count
          if (d.serviceCount === 0) return "#94a3b8"; // gray
          if (d.serviceCount <= 5) return "#22c55e"; // green
          if (d.serviceCount <= 20) return "#eab308"; // yellow
          return "#ef4444"; // red for many services
        } else {
          // Service nodes - color by status and enrichment
          if (d.status === "open") {
            return d.enrichments.length > 0 ? "#3b82f6" : "#22c55e"; // blue if enriched, green if open
          }
          return "#94a3b8"; // gray for closed
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add icons
    node
      .append("foreignObject")
      .attr("width", 24)
      .attr("height", 24)
      .attr("x", -12)
      .attr("y", -12)
      .append("xhtml:div")
      .style("width", "24px")
      .style("height", "24px")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("color", "white")
      .html((d) => {
        if (d.type === "host") {
          return '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>';
        } else {
          return '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
        }
      });

    // Add labels for hosts
    node
      .filter((d) => d.type === "host")
      .append("text")
      .attr("dy", 45)
      .attr("text-anchor", "middle")
      .style("fill", "#374151")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text((d) => d.ip);

    // Add port labels for services
    node
      .filter((d) => d.type === "service")
      .append("text")
      .attr("dy", 35)
      .attr("text-anchor", "middle")
      .style("fill", "#374151")
      .style("font-size", "10px")
      .text((d) => d.port || "?");

    // Add click handlers
    node.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    // Update positions on simulation tick
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

    // Handle container resize
    const handleResize = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        setDimensions({ width: newWidth, height: newHeight });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      simulation.stop();
    };
  }, [graphData, dimensions]);

  const formatEnrichments = (enrichments) => {
    if (!enrichments || enrichments.length === 0) return "None";

    const pluginCounts = enrichments.reduce((acc, e) => {
      acc[e.plugin_name] = (acc[e.plugin_name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(pluginCounts)
      .map(([plugin, count]) => `${plugin}${count > 1 ? ` (${count})` : ""}`)
      .join(", ");
  };

  const renderNodeDetails = () => {
    if (!selectedNode) return null;

    if (selectedNode.type === "host") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold">Host Details</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNode(null)}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <strong>IP Address:</strong> {selectedNode.ip}
            </div>
            <div>
              <strong>Total Services:</strong> {selectedNode.serviceCount}
            </div>
            <div>
              <strong>Open Services:</strong> {selectedNode.openServices}
            </div>
            <div>
              <strong>Enriched Services:</strong>{" "}
              {selectedNode.enrichedServices}
            </div>
          </div>

          <div>
            <strong>Services:</strong>
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {selectedNode.services.map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                >
                  <span>
                    Port {service.port} ({service.ip_protocol})
                  </span>
                  <div className="flex items-center space-x-1">
                    <Badge
                      variant={
                        service.status === "open" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {service.status}
                    </Badge>
                    {service.enrichments?.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {service.enrichments.length} enrichments
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else {
      const service = selectedNode.service;
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ServerIcon className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold">Service Details</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNode(null)}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <strong>Host:</strong> {selectedNode.hostIp}
            </div>
            <div>
              <strong>Port:</strong> {selectedNode.port}
            </div>
            <div>
              <strong>Protocol:</strong> {selectedNode.protocol}
            </div>
            <div>
              <strong>Service:</strong> {service.name || "Unknown"}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <Badge
                variant={service.status === "open" ? "default" : "secondary"}
                className="text-xs ml-1"
              >
                {service.status}
              </Badge>
            </div>
            <div>
              <strong>Enrichments:</strong>{" "}
              {formatEnrichments(selectedNode.enrichments)}
            </div>
          </div>

          {selectedNode.enrichments.length > 0 && (
            <div>
              <strong>Enrichment Details:</strong>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {selectedNode.enrichments.map((enrichment, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    <div className="font-medium text-sm">
                      {enrichment.plugin_name}
                    </div>
                    {enrichment.url && (
                      <div className="text-xs text-blue-600">
                        <a
                          href={enrichment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {enrichment.url}
                        </a>
                      </div>
                    )}
                    {enrichment.status_code && (
                      <div className="text-xs">
                        Status: {enrichment.status_code}
                      </div>
                    )}
                    {enrichment.title && (
                      <div className="text-xs">Title: {enrichment.title}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="w-full h-full flex">
      {/* Graph */}
      <div className="flex-1 relative">
        <Card className="w-full h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>Services Network Graph</span>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span>Closed/Unknown</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Open</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Enriched</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              style={{ minHeight: "500px" }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Details Panel */}
      {selectedNode && (
        <div className="w-80 ml-4">
          <Card className="h-full">
            <CardContent className="p-4">{renderNodeDetails()}</CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

registerComponent("ProjectViewServicesGraph", ProjectViewServicesGraph);

export default ProjectViewServicesGraph;
