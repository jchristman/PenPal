import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from "@mui/icons-material";
import { registerComponent } from "@penpal/core";

const BucketManager = ({
  buckets = [],
  loading = false,
  selectedBucket = null,
  onSelectBucket = () => {},
  onRefresh = () => {},
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!buckets || buckets.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        No buckets found. Create a new bucket to get started.
      </Alert>
    );
  }

  return (
    <Box>
      <List dense disablePadding>
        {buckets.map((bucket) => {
          const isSelected = selectedBucket?.id === bucket.id;

          return (
            <ListItem key={bucket.id} disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => onSelectBucket(bucket)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {isSelected ? (
                    <FolderOpenIcon color="primary" fontSize="small" />
                  ) : (
                    <FolderIcon color="action" fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={bucket.name}
                  secondary={`${bucket.fileCount || 0} files`}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  secondaryTypographyProps={{
                    variant: "caption",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

registerComponent("BucketManager", BucketManager);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default BucketManager;
