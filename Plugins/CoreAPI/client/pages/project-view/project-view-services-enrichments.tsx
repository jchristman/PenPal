import React, { useState, useMemo } from "react";
import { Components, registerComponent, Utils } from "@penpal/core";
import PenPal from "@penpal/core";
import {
  ChevronRightIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

// Import the new enhanced display
import EnhancedEnrichmentDisplay from "../../components/ui-directive-components/EnhancedEnrichmentDisplay";

// Import registry utilities
import {
  supportsCardView,
  getCardRenderer,
  getEnrichmentDisplay,
} from "./enrichment-registry";

const { cn } = Utils;
const {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Label,
  Input,
} = Components;

// Default card renderer component (fallback when plugins don't register custom renderers)
interface DefaultEnrichmentCardProps {
  service: any;
  enrichment: any;
}

const DefaultEnrichmentCard = ({ service, enrichment }: DefaultEnrichmentCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-mono">
              {service.host?.ip_address}:{service.port}
            </CardTitle>
            <CardDescription className="text-xs">
              {service.name}
              {service.host?.domains && service.host.domains.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Domains: {service.host.domains.map((d: any) => d.name).join(", ")}
                </div>
              )}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {service.ip_protocol}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <EnhancedEnrichmentDisplay enrichment={enrichment} />
      </CardContent>
    </Card>
  );
};

interface ProjectViewServicesEnrichmentsProps {
  services: any[];
}

const ProjectViewServicesEnrichments = ({ services }: ProjectViewServicesEnrichmentsProps) => {
  const [selectedEnrichmentType, setSelectedEnrichmentType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate enrichment type statistics
  const enrichmentTypes = useMemo(() => {
    const typeMap = new Map();

    services.forEach((service: any) => {
      service.enrichments?.forEach((enrichment: any) => {
        const pluginName = enrichment.plugin_name;
        if (!typeMap.has(pluginName)) {
          typeMap.set(pluginName, {
            pluginName,
            serviceCount: 0,
            enrichmentCount: 0,
            services: [],
          });
        }
        const typeData = typeMap.get(pluginName);
        typeData.enrichmentCount++;

        // Track unique services
        if (!typeData.services.find((s: any) => s.id === service.id)) {
          typeData.services.push(service);
          typeData.serviceCount++;
        }
      });
    });

    return Array.from(typeMap.values()).sort((a, b) =>
      a.pluginName.localeCompare(b.pluginName)
    );
  }, [services]);

  // Filter enrichment types by search term
  const filteredEnrichmentTypes = useMemo(() => {
    if (!searchTerm) return enrichmentTypes;
    const term = searchTerm.toLowerCase();
    return enrichmentTypes.filter((type) =>
      type.pluginName.toLowerCase().includes(term)
    );
  }, [enrichmentTypes, searchTerm]);

  // Get services with selected enrichment type
  const servicesWithEnrichment = useMemo(() => {
    if (!selectedEnrichmentType) return [];
    const typeData = enrichmentTypes.find(
      (t) => t.pluginName === selectedEnrichmentType
    );
    return typeData?.services || [];
  }, [selectedEnrichmentType, enrichmentTypes]);

  // Get enrichments of selected type for all services
  const enrichmentsOfType = useMemo(() => {
    if (!selectedEnrichmentType) return [];
    const result: { service: any; enrichment: any }[] = [];
    servicesWithEnrichment.forEach((service: any) => {
      service.enrichments?.forEach((enrichment: any) => {
        if (enrichment.plugin_name === selectedEnrichmentType) {
          result.push({
            service,
            enrichment,
          });
        }
      });
    });
    return result;
  }, [selectedEnrichmentType, servicesWithEnrichment]);

  // Check if selected enrichment type supports card view using registry
  const selectedEnrichmentSupportsCardView = useMemo(() => {
    if (!selectedEnrichmentType) return false;
    return supportsCardView(selectedEnrichmentType);
  }, [selectedEnrichmentType]);

  const handleEnrichmentTypeClick = (pluginName: string) => {
    setSelectedEnrichmentType(pluginName);
    setSearchTerm(""); // Clear search when selecting
  };

  const handleBack = () => {
    setSelectedEnrichmentType(null);
    setViewMode("table");
  };

  // Main enrichment types table view
  if (!selectedEnrichmentType) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enrichment Types</CardTitle>
          <CardDescription>
            Browse enrichments by type. Click on a row to see all services with
            that enrichment.
          </CardDescription>
          <div className="pt-4">
            <Input
              placeholder="Search enrichment types..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrichment Type</TableHead>
                <TableHead className="text-right">Services</TableHead>
                <TableHead className="text-right">Total Enrichments</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrichmentTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "No enrichment types found matching your search."
                        : "No enrichments available."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnrichmentTypes.map((type) => (
                  <TableRow
                    key={type.pluginName}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleEnrichmentTypeClick(type.pluginName)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{type.pluginName}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {type.serviceCount}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {type.enrichmentCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // Detail view: Show all services/enrichments of selected type
  return (
    <div className="space-y-4">
      {/* Header with back button and view toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle>
                  {selectedEnrichmentType} Enrichments
                </CardTitle>
                <CardDescription>
                  {enrichmentsOfType.length} enrichment
                  {enrichmentsOfType.length !== 1 ? "s" : ""} across{" "}
                  {servicesWithEnrichment.length} service
                  {servicesWithEnrichment.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
            {selectedEnrichmentSupportsCardView && (
              <div className="flex items-center gap-2 border rounded-md p-1">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="flex items-center gap-2"
                >
                  <TableCellsIcon className="h-4 w-4" />
                  Table
                </Button>
                <Button
                  variant={viewMode === "card" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                  className="flex items-center gap-2"
                >
                  <Squares2X2Icon className="h-4 w-4" />
                  Cards
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrichment Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichmentsOfType.map((item, index) => (
                  <TableRow key={`${item.service.id}-${index}`}>
                    <TableCell className="font-mono">
                      <div className="space-y-1">
                        <div>{item.service.host?.ip_address || "Unknown"}</div>
                        {item.service.host?.domains && item.service.host.domains.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Domains: {item.service.host.domains.map((d: any) => d.name).join(", ")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {item.service.port || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.service.ip_protocol === "TCP"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }
                      >
                        {item.service.ip_protocol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.service.status === "open" ? "default" : "secondary"
                        }
                        className={
                          item.service.status === "open"
                            ? "bg-green-100 text-green-700"
                            : ""
                        }
                      >
                        {item.service.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        // Try to get plugin-specific display component, fallback to default
                        const DisplayComponent =
                          getEnrichmentDisplay(item.enrichment.plugin_name) ||
                          EnhancedEnrichmentDisplay;
                        return <DisplayComponent enrichment={item.enrichment} />;
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Card View (uses plugin-registered renderers) */}
      {viewMode === "card" && selectedEnrichmentSupportsCardView && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {enrichmentsOfType.map((item, index) => {
            // Get plugin-specific card renderer, or use default
            const CardRenderer =
              getCardRenderer(item.enrichment.plugin_name) ||
              DefaultEnrichmentCard;

            return (
              <CardRenderer
                key={`${item.service.id}-${index}`}
                service={item.service}
                enrichment={item.enrichment}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

registerComponent(
  "ProjectViewServicesEnrichments",
  ProjectViewServicesEnrichments
);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewServicesEnrichments;
