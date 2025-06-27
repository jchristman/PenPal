import React from "react";
import {
  Box,
  Typography,
  Chip,
  Link,
  Card,
  CardContent,
  CardHeader,
  Stack,
} from "@mui/material";
import {
  OpenInNew,
  CheckCircle,
  Error,
  Security,
  Speed,
} from "@mui/icons-material";
import { makeStyles } from "@mui/styles";
import { registerComponent } from "@penpal/core";

const useStyles = makeStyles((theme) => ({
  enrichmentCard: {
    marginBottom: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
  },
  urlSection: {
    marginBottom: theme.spacing(2),
  },
  statusSection: {
    marginBottom: theme.spacing(2),
  },
  techSection: {
    marginBottom: theme.spacing(2),
  },
  metadataSection: {
    marginBottom: theme.spacing(1),
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  techChip: {
    margin: theme.spacing(0.25),
  },
  metadataItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(0.5),
  },
  metadataLabel: {
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  metadataValue: {
    fontFamily: "monospace",
  },
}));

const HttpXEnrichmentDisplay = ({ enrichment }) => {
  const classes = useStyles();

  const getStatusColor = (status_code) => {
    if (status_code >= 200 && status_code < 300) return "success";
    if (status_code >= 300 && status_code < 400) return "warning";
    if (status_code >= 400) return "error";
    return "default";
  };

  const getStatusIcon = (status_code) => {
    if (status_code >= 200 && status_code < 300) return <CheckCircle />;
    if (status_code >= 400) return <Error />;
    return <Security />;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (ms) => {
    if (!ms) return "Unknown";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card className={classes.enrichmentCard}>
      <CardHeader
        title="HTTP Service Information"
        titleTypographyProps={{ variant: "h6" }}
        avatar={<Speed color="primary" />}
      />
      <CardContent>
        <Stack spacing={2}>
          {/* URL Section */}
          {enrichment.url && (
            <Box className={classes.urlSection}>
              <Typography variant="body2" className={classes.sectionTitle}>
                URL:
              </Typography>
              <Box display="flex" alignItems="center">
                <Link
                  href={enrichment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body1"
                  sx={{ wordBreak: "break-all" }}
                >
                  {enrichment.url}
                </Link>
                <OpenInNew fontSize="small" sx={{ ml: 1 }} />
              </Box>
            </Box>
          )}

          {/* Status Section */}
          {enrichment.status_code && (
            <Box className={classes.statusSection}>
              <Typography variant="body2" className={classes.sectionTitle}>
                HTTP Response:
              </Typography>
              <Chip
                icon={getStatusIcon(enrichment.status_code)}
                label={`${enrichment.status_code} ${
                  enrichment.status_code >= 200 && enrichment.status_code < 300
                    ? "OK"
                    : enrichment.status_code >= 300 &&
                      enrichment.status_code < 400
                    ? "Redirect"
                    : enrichment.status_code >= 400 &&
                      enrichment.status_code < 500
                    ? "Client Error"
                    : enrichment.status_code >= 500
                    ? "Server Error"
                    : "Unknown"
                }`}
                color={getStatusColor(enrichment.status_code)}
                size="small"
              />
            </Box>
          )}

          {/* Technology Stack */}
          {enrichment.tech && enrichment.tech.length > 0 && (
            <Box className={classes.techSection}>
              <Typography variant="body2" className={classes.sectionTitle}>
                Technology Stack:
              </Typography>
              <Box display="flex" flexWrap="wrap">
                {enrichment.tech.map((tech, index) => (
                  <Chip
                    key={index}
                    label={tech}
                    size="small"
                    variant="outlined"
                    className={classes.techChip}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Metadata Section */}
          <Box className={classes.metadataSection}>
            <Typography variant="body2" className={classes.sectionTitle}>
              Response Details:
            </Typography>
            <Stack spacing={0.5}>
              {enrichment.content_type && (
                <Box className={classes.metadataItem}>
                  <Typography variant="body2" className={classes.metadataLabel}>
                    Content Type:
                  </Typography>
                  <Typography variant="body2" className={classes.metadataValue}>
                    {enrichment.content_type}
                  </Typography>
                </Box>
              )}

              {enrichment.content_length && (
                <Box className={classes.metadataItem}>
                  <Typography variant="body2" className={classes.metadataLabel}>
                    Content Length:
                  </Typography>
                  <Typography variant="body2" className={classes.metadataValue}>
                    {formatBytes(enrichment.content_length)}
                  </Typography>
                </Box>
              )}

              {enrichment.title && (
                <Box className={classes.metadataItem}>
                  <Typography variant="body2" className={classes.metadataLabel}>
                    Page Title:
                  </Typography>
                  <Typography variant="body2" className={classes.metadataValue}>
                    {enrichment.title}
                  </Typography>
                </Box>
              )}

              {enrichment.server && (
                <Box className={classes.metadataItem}>
                  <Typography variant="body2" className={classes.metadataLabel}>
                    Server:
                  </Typography>
                  <Typography variant="body2" className={classes.metadataValue}>
                    {enrichment.server}
                  </Typography>
                </Box>
              )}

              {enrichment.method && (
                <Box className={classes.metadataItem}>
                  <Typography variant="body2" className={classes.metadataLabel}>
                    Method:
                  </Typography>
                  <Typography variant="body2" className={classes.metadataValue}>
                    {enrichment.method}
                  </Typography>
                </Box>
              )}

              {enrichment.scheme && (
                <Box className={classes.metadataItem}>
                  <Typography variant="body2" className={classes.metadataLabel}>
                    Scheme:
                  </Typography>
                  <Typography variant="body2" className={classes.metadataValue}>
                    {enrichment.scheme}
                  </Typography>
                </Box>
              )}

              {enrichment.path && (
                <Box className={classes.metadataItem}>
                  <Typography variant="body2" className={classes.metadataLabel}>
                    Path:
                  </Typography>
                  <Typography variant="body2" className={classes.metadataValue}>
                    {enrichment.path}
                  </Typography>
                </Box>
              )}

              {enrichment.response_time && (
                <Box className={classes.metadataItem}>
                  <Typography variant="body2" className={classes.metadataLabel}>
                    Response Time:
                  </Typography>
                  <Typography variant="body2" className={classes.metadataValue}>
                    {formatDuration(enrichment.response_time)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

registerComponent("HttpXEnrichmentDisplay", HttpXEnrichmentDisplay);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default HttpXEnrichmentDisplay;
