import React from "react";
import { registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import {
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
  Grid,
  Paper,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Fingerprint as FingerprintIcon,
  Info as InfoIcon,
  Build as BuildIcon,
} from "@mui/icons-material";

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(1),
  },
  section: {
    marginBottom: theme.spacing(2),
  },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  fieldContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
  },
  fieldLabel: {
    fontWeight: "bold",
    color: theme.palette.text.secondary,
  },
  fieldValue: {
    color: theme.palette.text.primary,
  },
  serviceChip: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  },
  productChip: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  versionChip: {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
  },
  fingerprintBox: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    fontFamily: "monospace",
    fontSize: "0.875rem",
    wordBreak: "break-all",
  },
}));

const NmapEnrichmentDisplay = ({ enrichment }) => {
  const classes = useStyles();

  // Extract data from the enrichment.data field
  const data = enrichment.data || {};

  const { service, fingerprint, product, version, extra_info } = data;

  const hasServiceInfo = service || product || version;
  const hasFingerprint = fingerprint;
  const hasExtraInfo = extra_info;

  return (
    <Box className={classes.container}>
      {/* Service Information Section */}
      {hasServiceInfo && (
        <Box className={classes.section}>
          <Box className={classes.iconContainer}>
            <SecurityIcon color="primary" />
            <Typography variant="h6" color="primary">
              Service Information
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {service && (
              <Chip
                label={`Service: ${service}`}
                className={classes.serviceChip}
                size="small"
              />
            )}
            {product && (
              <Chip
                label={`Product: ${product}`}
                className={classes.productChip}
                size="small"
              />
            )}
            {version && (
              <Chip
                label={`Version: ${version}`}
                className={classes.versionChip}
                size="small"
              />
            )}
          </Stack>
        </Box>
      )}

      {/* Fingerprint Section */}
      {hasFingerprint && (
        <Box className={classes.section}>
          <Box className={classes.iconContainer}>
            <FingerprintIcon color="secondary" />
            <Typography variant="h6" color="secondary">
              Service Fingerprint
            </Typography>
          </Box>

          <Paper className={classes.fingerprintBox} elevation={0}>
            <Typography variant="body2">{fingerprint}</Typography>
          </Paper>
        </Box>
      )}

      {/* Extra Information Section */}
      {hasExtraInfo && (
        <Box className={classes.section}>
          <Box className={classes.iconContainer}>
            <InfoIcon color="info" />
            <Typography variant="h6" color="textSecondary">
              Additional Information
            </Typography>
          </Box>

          <Box className={classes.fieldContainer}>
            <Typography variant="body2" className={classes.fieldLabel}>
              Extra Info:
            </Typography>
            <Typography variant="body2" className={classes.fieldValue}>
              {extra_info}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Show message if no data available */}
      {!hasServiceInfo && !hasFingerprint && !hasExtraInfo && (
        <Box textAlign="center" py={2}>
          <BuildIcon color="disabled" fontSize="large" />
          <Typography variant="body2" color="textSecondary">
            No detailed service information available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

registerComponent("NmapEnrichmentDisplay", NmapEnrichmentDisplay);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default NmapEnrichmentDisplay;
