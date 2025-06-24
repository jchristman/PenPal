import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Paper,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { registerComponent } from "@penpal/core";

const FileUpload = ({ bucket, onUploadComplete = () => {} }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState([]);

  const handleFileSelect = useCallback((event) => {
    const selectedFiles = Array.from(event.target.files);
    const fileObjects = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...fileObjects]);
  }, []);

  const removeFile = useCallback((fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setUploadResults((prev) => prev.filter((r) => r.id !== fileId));
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const fileObject = files[i];

      try {
        // Simulate upload progress
        const progressSteps = 10;
        for (let step = 0; step <= progressSteps; step++) {
          setUploadProgress(((i + step / progressSteps) / files.length) * 100);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Mock successful upload
        results.push({
          id: fileObject.id,
          name: fileObject.name,
          status: "success",
          message: "Upload successful",
        });

        // Update file status
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObject.id ? { ...f, status: "success" } : f
          )
        );
      } catch (error) {
        results.push({
          id: fileObject.id,
          name: fileObject.name,
          status: "error",
          message: error.message || "Upload failed",
        });

        // Update file status
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObject.id ? { ...f, status: "error" } : f
          )
        );
      }
    }

    setUploadResults(results);
    setUploading(false);
    setUploadProgress(100);

    // Notify parent component
    const successfulUploads = results.filter((r) => r.status === "success");
    if (successfulUploads.length > 0) {
      onUploadComplete(successfulUploads);
    }
  }, [files, onUploadComplete]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckIcon color="success" fontSize="small" />;
      case "error":
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return <FileIcon color="action" fontSize="small" />;
    }
  };

  const clearCompleted = () => {
    setFiles([]);
    setUploadResults([]);
    setUploadProgress(0);
  };

  if (!bucket) {
    return (
      <Alert severity="warning">
        Please select a bucket before uploading files.
      </Alert>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Upload Files to "{bucket.name}"
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: "center",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
          component="label"
        >
          <input
            type="file"
            multiple
            hidden
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <UploadIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="body1" gutterBottom>
            Click to select files or drag and drop
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multiple files are supported
          </Typography>
        </Paper>
      </Box>

      {files.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Selected Files ({files.length})
          </Typography>

          <List dense>
            {files.map((fileObject) => (
              <ListItem
                key={fileObject.id}
                secondaryAction={
                  !uploading && (
                    <IconButton
                      edge="end"
                      onClick={() => removeFile(fileObject.id)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )
                }
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {getStatusIcon(fileObject.status)}
                </ListItemIcon>
                <ListItemText
                  primary={fileObject.name}
                  secondary={formatFileSize(fileObject.size)}
                />
              </ListItem>
            ))}
          </List>

          {uploading && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Uploading... {Math.round(uploadProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          <Box mt={2} display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              startIcon={<UploadIcon />}
            >
              {uploading ? "Uploading..." : "Upload Files"}
            </Button>

            {uploadResults.length > 0 && (
              <Button
                variant="outlined"
                onClick={clearCompleted}
                disabled={uploading}
              >
                Clear List
              </Button>
            )}
          </Box>
        </Box>
      )}

      {uploadResults.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Upload Results
          </Typography>

          {uploadResults.filter((r) => r.status === "success").length > 0 && (
            <Alert severity="success" sx={{ mb: 1 }}>
              {uploadResults.filter((r) => r.status === "success").length}{" "}
              file(s) uploaded successfully
            </Alert>
          )}

          {uploadResults.filter((r) => r.status === "error").length > 0 && (
            <Alert severity="error">
              {uploadResults.filter((r) => r.status === "error").length} file(s)
              failed to upload
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

registerComponent("FileUpload", FileUpload);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default FileUpload;
