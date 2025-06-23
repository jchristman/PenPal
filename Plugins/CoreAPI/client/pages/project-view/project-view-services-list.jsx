import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const useStyles = makeStyles((theme) => ({
  card: {
    minWidth: `calc(50% - ${theme.spacing(2)})`,
    border: `1px solid ${theme.palette.divider}`,
  },
  statusChip: {
    marginLeft: theme.spacing(1),
  },
  enrichmentCount: {
    marginTop: theme.spacing(1),
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
  },
  serviceInfo: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
}));

const ProjectViewServicesList = ({ services }) => {
  const classes = useStyles();

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "success";
      case "closed":
        return "error";
      case "filtered":
        return "warning";
      default:
        return "default";
    }
  };

  const getProtocolColor = (protocol) => {
    switch (protocol?.toLowerCase()) {
      case "tcp":
        return "primary";
      case "udp":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Stack spacing={2} direction="row" useFlexGap flexWrap="wrap">
      {services.map((service) => (
        <Card key={service.id} className={classes.card}>
          <CardHeader
            title={
              <Box display="flex" alignItems="center">
                {service.host?.ip_address}:{service.port}
                <Chip
                  label={service.status}
                  color={getStatusColor(service.status)}
                  size="small"
                  className={classes.statusChip}
                />
              </Box>
            }
            subheader={service.name}
          />
          <CardContent>
            <div className={classes.serviceInfo}>
              <div className={classes.infoRow}>
                <Typography variant="body2" color="textSecondary">
                  Protocol:
                </Typography>
                <Chip
                  label={service.ip_protocol}
                  color={getProtocolColor(service.ip_protocol)}
                  size="small"
                />
              </div>

              {service.host?.hostnames && service.host.hostnames.length > 0 && (
                <div className={classes.infoRow}>
                  <Typography variant="body2" color="textSecondary">
                    Hostnames:
                  </Typography>
                  <Typography variant="body2">
                    {service.host.hostnames.join(", ")}
                  </Typography>
                </div>
              )}

              {service.ttl && (
                <div className={classes.infoRow}>
                  <Typography variant="body2" color="textSecondary">
                    TTL:
                  </Typography>
                  <Typography variant="body2">{service.ttl}</Typography>
                </div>
              )}

              {service.enrichments && service.enrichments.length > 0 && (
                <Typography className={classes.enrichmentCount}>
                  {service.enrichments.length} enrichment
                  {service.enrichments.length !== 1 ? "s" : ""} available
                </Typography>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {services.length === 0 && (
        <Typography variant="body1" color="textSecondary">
          No services found for this project.
        </Typography>
      )}
    </Stack>
  );
};

registerComponent("ProjectViewServicesList", ProjectViewServicesList);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default ProjectViewServicesList;
