import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Chip,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { registerComponent } from "@penpal/core";

const FileBrowser = ({ bucket, onFileAction = () => {} }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Mock data - in real implementation, this would come from GraphQL
  const files = bucket
    ? [
        {
          id: "1",
          name: "document.pdf",
          size: 2048000,
          lastModified: new Date("2024-01-15T10:30:00Z"),
          type: "application/pdf",
        },
        {
          id: "2",
          name: "image.png",
          size: 512000,
          lastModified: new Date("2024-01-14T09:15:00Z"),
          type: "image/png",
        },
        {
          id: "3",
          name: "data.json",
          size: 1024,
          lastModified: new Date("2024-01-13T14:45:00Z"),
          type: "application/json",
        },
      ]
    : [];

  const handleMenuOpen = (event, file) => {
    setAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFile(null);
  };

  const handleFileAction = (action) => {
    if (selectedFile) {
      onFileAction(action, selectedFile);
    }
    handleMenuClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileTypeChip = (type) => {
    const typeMap = {
      "application/pdf": { label: "PDF", color: "error" },
      "image/png": { label: "PNG", color: "info" },
      "image/jpeg": { label: "JPG", color: "info" },
      "application/json": { label: "JSON", color: "success" },
      "text/plain": { label: "TXT", color: "default" },
    };

    const config = typeMap[type] || { label: "FILE", color: "default" };
    return (
      <Chip
        label={config.label}
        size="small"
        color={config.color}
        variant="outlined"
      />
    );
  };

  if (!bucket) {
    return <Alert severity="info">Select a bucket to view its files.</Alert>;
  }

  if (files.length === 0) {
    return (
      <Alert severity="info">
        No files found in bucket "{bucket.name}". Upload some files to get
        started.
      </Alert>
    );
  }

  return (
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell width={50}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <FileIcon color="action" fontSize="small" />
                    <Typography variant="body2">{file.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{getFileTypeChip(file.type)}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(file.lastModified)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, file)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleFileAction("download")}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem onClick={() => handleFileAction("info")}>
          <InfoIcon fontSize="small" sx={{ mr: 1 }} />
          Details
        </MenuItem>
        <MenuItem onClick={() => handleFileAction("delete")}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

registerComponent("FileBrowser", FileBrowser);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default FileBrowser;
