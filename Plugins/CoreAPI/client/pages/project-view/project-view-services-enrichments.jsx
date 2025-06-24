import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import PenPal from "@penpal/core";
import { makeStyles } from "@mui/styles";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

const useStyles = makeStyles((theme) => ({
  card: {
    minWidth: `calc(100% - ${theme.spacing(2)})`,
    border: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(2),
  },
  serviceHeader: {
    background: theme.palette.grey[50],
  },
  enrichmentAccordion: {
    boxShadow: "none",
    border: `1px solid ${theme.palette.divider}`,
    "&:before": {
      display: "none",
    },
  },
  enrichmentHeader: {
    backgroundColor: theme.palette.grey[100],
  },
  pluginChip: {
    marginLeft: theme.spacing(1),
  },
  noEnrichments: {
    textAlign: "center",
    color: theme.palette.text.secondary,
    padding: theme.spacing(2),
  },
}));

// Initialize the enrichment display registry on the PenPal object
if (!PenPal.API) {
  PenPal.API = {};
}
if (!PenPal.API.EnrichmentDisplayRegistry) {
  PenPal.API.EnrichmentDisplayRegistry = new Map();
}

// Function to register enrichment display components
const registerEnrichmentDisplay = (pluginName, component) => {
  if (!PenPal.API) {
    PenPal.API = {};
  }
  if (!PenPal.API.EnrichmentDisplayRegistry) {
    PenPal.API.EnrichmentDisplayRegistry = new Map();
  }

  PenPal.API.EnrichmentDisplayRegistry.set(pluginName, component);
};

// Make the registration function available on PenPal.API
PenPal.API.registerEnrichmentDisplay = registerEnrichmentDisplay;

// Default enrichment display component
const DefaultEnrichmentDisplay = ({
  enrichment,
  serviceSelector,
  service,
  project,
}) => {
  console.log("DefaultEnrichmentDisplay received:", {
    enrichment,
    serviceSelector,
    service,
    project,
  });

  // Show all top-level properties
  const topLevelEntries = Object.entries(enrichment).filter(
    ([key]) => key !== "plugin_name"
  );

  // If there's a data field, also show its contents
  const dataEntries = enrichment.data ? Object.entries(enrichment.data) : [];

  return (
    <Box>
      <Typography variant="caption" color="textSecondary" gutterBottom>
        Debug: Enrichment Structure
      </Typography>

      {topLevelEntries.map(([key, value]) => (
        <Box key={key} display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="textSecondary">
            {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
          </Typography>
          <Typography variant="body2">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </Typography>
        </Box>
      ))}

      {dataEntries.length > 0 && (
        <>
          <Typography
            variant="caption"
            color="primary"
            gutterBottom
            sx={{ mt: 2, display: "block" }}
          >
            Data Field Contents:
          </Typography>
          {dataEntries.map(([key, value]) => (
            <Box key={key} display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="textSecondary">
                {key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                :
              </Typography>
              <Typography variant="body2">
                {Array.isArray(value) ? value.join(", ") : String(value)}
              </Typography>
            </Box>
          ))}
        </>
      )}

      {/* Show service selector for debugging */}
      {serviceSelector && (
        <Box mt={2}>
          <Typography variant="caption" color="info.main" gutterBottom>
            Service Selector: {JSON.stringify(serviceSelector)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const ProjectViewServicesEnrichments = ({ services, project }) => {
  const classes = useStyles();

  // Filter services that have enrichments
  const servicesWithEnrichments = services.filter(
    (service) => service.enrichments && service.enrichments.length > 0
  );

  const renderEnrichment = (service, enrichment, index) => {
    const { plugin_name } = enrichment;

    // Safely access the enrichment display registry
    let DisplayComponent = DefaultEnrichmentDisplay;
    if (PenPal.API?.EnrichmentDisplayRegistry) {
      DisplayComponent =
        PenPal.API.EnrichmentDisplayRegistry.get(plugin_name) ||
        DefaultEnrichmentDisplay;
    }

    // Create serviceSelector for file attachment queries
    const serviceSelector = {
      host: service.host?.ip_address,
      port: service.port,
      ip_protocol: service.ip_protocol,
      project_id: project?.id,
    };

    return (
      <Accordion key={index} className={classes.enrichmentAccordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          className={classes.enrichmentHeader}
        >
          <Typography variant="body1">
            {plugin_name} Enrichment
            <Chip
              label={plugin_name}
              size="small"
              color="primary"
              className={classes.pluginChip}
            />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <DisplayComponent
            enrichment={enrichment}
            serviceSelector={serviceSelector}
            service={service}
            project={project}
          />
        </AccordionDetails>
      </Accordion>
    );
  };

  if (servicesWithEnrichments.length === 0) {
    return (
      <Box className={classes.noEnrichments}>
        <Typography variant="h6">No Service Enrichments</Typography>
        <Typography variant="body2">
          Services will appear here when plugins add enrichment data (e.g., HTTP
          scans, vulnerability assessments).
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {servicesWithEnrichments.map((service) => (
        <Card key={service.id} className={classes.card}>
          <CardHeader
            title={`${service.host?.ip_address}:${service.port}`}
            subheader={`${service.name} (${service.ip_protocol})`}
            className={classes.serviceHeader}
          />
          <CardContent>
            <Stack spacing={1}>
              {service.enrichments.map((enrichment, index) =>
                renderEnrichment(service, enrichment, index)
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

registerComponent(
  "ProjectViewServicesEnrichments",
  ProjectViewServicesEnrichments
);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewServicesEnrichments;
