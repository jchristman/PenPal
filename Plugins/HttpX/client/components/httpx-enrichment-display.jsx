import React from "react";
import { registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
  },
  urlSection: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
  },
  statusSection: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    alignItems: "center",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: theme.spacing(1),
    alignItems: "center",
  },
  techChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.5),
  },
}));

const HttpXEnrichmentDisplay = ({ enrichment }) => {
  const classes = useStyles();

  // Extract data from the enrichment.data field
  const data = enrichment.data || {};

  const getStatusIcon = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <CheckCircleIcon color="success" />;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <ErrorIcon color="error" />;
    } else if (statusCode >= 500) {
      return <ErrorIcon color="error" />;
    } else {
      return <WarningIcon color="warning" />;
    }
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) {
      return "success";
    } else if (statusCode >= 400 && statusCode < 500) {
      return "error";
    } else if (statusCode >= 500) {
      return "error";
    } else {
      return "warning";
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Box className={classes.container}>
      {/* URL Section */}
      {data.url && (
        <Box className={classes.urlSection}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Discovered URL:
          </Typography>
          <Link
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="body1"
          >
            {data.url}
          </Link>
        </Box>
      )}

      {/* Status Section */}
      <Box className={classes.statusSection}>
        {data.status_code && (
          <>
            {getStatusIcon(data.status_code)}
            <Chip
              label={`HTTP ${data.status_code}`}
              color={getStatusColor(data.status_code)}
              size="small"
            />
          </>
        )}

        {data.method && (
          <Chip label={data.method} variant="outlined" size="small" />
        )}

        {data.scheme && (
          <Chip
            label={data.scheme.toUpperCase()}
            color={data.scheme === "https" ? "success" : "default"}
            variant="outlined"
            size="small"
          />
        )}
      </Box>

      {/* Information Grid */}
      <Box className={classes.infoGrid}>
        {data.title && (
          <>
            <Typography variant="body2" color="textSecondary">
              Page Title:
            </Typography>
            <Typography variant="body2">{data.title}</Typography>
          </>
        )}

        {data.server && (
          <>
            <Typography variant="body2" color="textSecondary">
              Server:
            </Typography>
            <Typography variant="body2">{data.server}</Typography>
          </>
        )}

        {data.content_type && (
          <>
            <Typography variant="body2" color="textSecondary">
              Content Type:
            </Typography>
            <Typography variant="body2">{data.content_type}</Typography>
          </>
        )}

        {data.content_length && (
          <>
            <Typography variant="body2" color="textSecondary">
              Content Length:
            </Typography>
            <Typography variant="body2">
              {formatBytes(data.content_length)}
            </Typography>
          </>
        )}

        {data.path && data.path !== "/" && (
          <>
            <Typography variant="body2" color="textSecondary">
              Path:
            </Typography>
            <Typography variant="body2">{data.path}</Typography>
          </>
        )}
      </Box>

      {/* Technology Stack */}
      {data.tech && data.tech.length > 0 && (
        <Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Detected Technologies:
          </Typography>
          <Box className={classes.techChips}>
            {data.tech.map((technology, index) => (
              <Chip
                key={index}
                label={technology}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

registerComponent("HttpXEnrichmentDisplay", HttpXEnrichmentDisplay);

export default HttpXEnrichmentDisplay;
