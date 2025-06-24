import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add as AddIcon, CloudUpload as UploadIcon } from "@mui/icons-material";
import { useQuery, useMutation } from "@apollo/client";
import { registerComponent } from "@penpal/core";

import BucketManager from "../../components/bucket-manager.jsx";
import FileBrowser from "../../components/file-browser.jsx";
import FileUpload from "../../components/file-upload.jsx";
import GET_BUCKETS from "./queries/get-buckets.js";
import CREATE_BUCKET from "./mutations/create-bucket.js";

const FileManagerPage = () => {
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [createBucketOpen, setCreateBucketOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch buckets
  const {
    data: bucketsData,
    loading: bucketsLoading,
    refetch: refetchBuckets,
  } = useQuery(GET_BUCKETS);

  // Create bucket mutation
  const [createBucket, { loading: creating }] = useMutation(CREATE_BUCKET, {
    onCompleted: () => {
      setSnackbar({
        open: true,
        message: "Bucket created successfully!",
        severity: "success",
      });
      setCreateBucketOpen(false);
      setNewBucketName("");
      refetchBuckets();
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: `Error creating bucket: ${error.message}`,
        severity: "error",
      });
    },
  });

  const handleCreateBucket = () => {
    if (newBucketName.trim()) {
      createBucket({ variables: { name: newBucketName.trim() } });
    }
  };

  const handleBucketSelect = (bucket) => {
    setSelectedBucket(bucket);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          File Manager
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage files and buckets in your PenPal file storage system
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Bucket Management Panel */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, height: "fit-content" }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Buckets</Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setCreateBucketOpen(true)}
              >
                Create
              </Button>
            </Box>

            <BucketManager
              buckets={bucketsData?.getBuckets || []}
              loading={bucketsLoading}
              selectedBucket={selectedBucket}
              onSelectBucket={handleBucketSelect}
              onRefresh={refetchBuckets}
            />
          </Paper>
        </Grid>

        {/* File Browser Panel */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">
                Files {selectedBucket ? `in "${selectedBucket.name}"` : ""}
              </Typography>
              {selectedBucket && (
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload File
                </Button>
              )}
            </Box>

            <FileBrowser
              bucket={selectedBucket}
              onFileAction={(action, file) => {
                // Handle file actions (download, delete, etc.)
                console.log("File action:", action, file);
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Create Bucket Dialog */}
      <Dialog
        open={createBucketOpen}
        onClose={() => setCreateBucketOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Bucket</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Bucket Name"
            fullWidth
            variant="outlined"
            value={newBucketName}
            onChange={(e) => setNewBucketName(e.target.value)}
            placeholder="Enter bucket name (e.g., project-files)"
            helperText="Bucket names should be lowercase and contain only letters, numbers, and hyphens"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateBucketOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBucket}
            disabled={!newBucketName.trim() || creating}
            variant="contained"
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Files to {selectedBucket?.name}</DialogTitle>
        <DialogContent>
          <FileUpload
            bucket={selectedBucket}
            onUploadComplete={(files) => {
              setSnackbar({
                open: true,
                message: `Successfully uploaded ${files.length} file(s)!`,
                severity: "success",
              });
              setUploadDialogOpen(false);
              // Refresh file browser
            }}
            onUploadError={(error) => {
              setSnackbar({
                open: true,
                message: `Upload failed: ${error.message}`,
                severity: "error",
              });
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

registerComponent("FileManagerPage", FileManagerPage);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default FileManagerPage;
