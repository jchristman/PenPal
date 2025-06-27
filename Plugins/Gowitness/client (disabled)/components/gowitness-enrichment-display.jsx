import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Link,
  Card,
  Modal,
  Backdrop,
  Fade,
} from "@mui/material";
import { OpenInNew, PhotoCamera, Schedule } from "@mui/icons-material";
import { registerComponent } from "@penpal/core";

const GowitnessEnrichmentDisplay = ({ enrichment }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const getStatusColor = (status_code) => {
    if (status_code >= 200 && status_code < 300) return "success";
    if (status_code >= 400) return "error";
    return "default";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Box>
      {/* Screenshot Display */}
      {enrichment.screenshot_url && (
        <>
          <Card
            sx={{
              mb: 2,
              maxWidth: 600,
              cursor: "pointer",
              "&:hover": { boxShadow: 6 },
            }}
            onClick={handleOpen}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Screenshot Preview (click to enlarge):
              </Typography>
              <img
                src={enrichment.screenshot_url}
                alt={`Screenshot of ${enrichment.url}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                }}
              />
            </Box>
          </Card>
          <Modal
            open={open}
            onClose={handleClose}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
              timeout: 500,
            }}
          >
            <Fade in={open}>
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "90vw",
                  bgcolor: "background.paper",
                  boxShadow: 24,
                  p: 2,
                  outline: "none",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  src={enrichment.screenshot_url}
                  alt={`Screenshot of ${enrichment.url}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "90vh",
                    objectFit: "contain",
                  }}
                />
              </Box>
            </Fade>
          </Modal>
        </>
      )}

      {/* Show loading state if we have bucket/key but no URL yet */}
      {!enrichment.screenshot_url &&
        enrichment.screenshot_bucket &&
        enrichment.screenshot_key && (
          <Card sx={{ mb: 2, maxWidth: 600 }}>
            <Box
              sx={{
                p: 2,
                textAlign: "center",
                color: "text.secondary",
                height: 200,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <PhotoCamera sx={{ fontSize: 48, opacity: 0.5, mb: 1 }} />
              <Typography variant="body2">Loading screenshot...</Typography>
              <Typography variant="caption">
                {enrichment.screenshot_bucket}/{enrichment.screenshot_key}
              </Typography>
            </Box>
          </Card>
        )}

      {/* URL with external link icon */}
      {enrichment.url && (
        <Box display="flex" alignItems="center" mb={2}>
          <Link
            href={enrichment.url}
            target="_blank"
            rel="noopener"
            sx={{ mr: 1 }}
          >
            {enrichment.url}
          </Link>
          <OpenInNew fontSize="small" />
        </Box>
      )}

      {/* HTTP Status */}
      {enrichment.status_code && (
        <Box display="flex" alignItems="center" mb={1}>
          <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
            Status:
          </Typography>
          <Chip
            label={enrichment.status_code}
            color={getStatusColor(enrichment.status_code)}
            size="small"
          />
        </Box>
      )}

      {/* Page Title */}
      {enrichment.title && (
        <Box display="flex" alignItems="center" mb={1}>
          <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
            Title:
          </Typography>
          <Typography variant="body2">{enrichment.title}</Typography>
        </Box>
      )}

      {/* Capture Timestamp */}
      {enrichment.captured_at && (
        <Box display="flex" alignItems="center" mb={1}>
          <Schedule fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
          <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
            Captured:
          </Typography>
          <Typography variant="body2">
            {formatDate(enrichment.captured_at)}
          </Typography>
        </Box>
      )}

      {/* Screenshot Details */}
      {enrichment.screenshot_bucket && enrichment.screenshot_key && (
        <Box mt={1}>
          <Typography variant="caption" color="textSecondary" gutterBottom>
            Screenshot Details:
          </Typography>
          <Box display="flex" flexDirection="column" ml={1}>
            <Typography variant="body2" fontSize="0.75rem">
              Bucket: {enrichment.screenshot_bucket}
            </Typography>
            <Typography variant="body2" fontSize="0.75rem">
              Key: {enrichment.screenshot_key}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

registerComponent("GowitnessEnrichmentDisplay", GowitnessEnrichmentDisplay);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default GowitnessEnrichmentDisplay;
