import React from "react";
import { registerComponent } from "@penpal/core";
import { makeStyles } from "@mui/styles";
import {
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Paper,
  Button,
} from "@mui/material";
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
} from "@mui/icons-material";

const useStyles = makeStyles((theme) => ({
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  loadingBox: {
    maxWidth: 400,
    padding: theme.spacing(4),
    textAlign: "center",
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[4],
  },
  errorBox: {
    maxWidth: 500,
    padding: theme.spacing(4),
    textAlign: "center",
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[4],
    backgroundColor: "#fff5f5",
    border: "1px solid #feb2b2",
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(3),
    fontFamily: "'Roboto', sans-serif",
  },
  progressContainer: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  statusText: {
    marginTop: theme.spacing(2),
    color: theme.palette.text.secondary,
    minHeight: 24,
  },
  errorTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    color: "#c53030",
  },
  errorMessage: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: "#fffafa",
    borderRadius: theme.spacing(1),
    border: "1px solid #fed7d7",
    fontFamily: "monospace",
    fontSize: 14,
    color: "#2d3748",
    textAlign: "left",
    maxHeight: 200,
    overflow: "auto",
  },
  retryButton: {
    marginTop: theme.spacing(2),
  },
  successIcon: {
    color: "#38a169",
    fontSize: 48,
    marginBottom: theme.spacing(2),
  },
}));

const ApolloLoading = ({
  status,
  error,
  onRetry,
  progress = 0,
  maxRetries = 10,
  currentRetry = 0,
}) => {
  const classes = useStyles();

  if (error) {
    const hasExhaustedRetries = currentRetry >= maxRetries;

    return (
      <div className={classes.container}>
        <Paper className={classes.errorBox}>
          <div className={classes.errorTitle}>
            <ErrorIcon />
            <Typography variant="h6">
              {hasExhaustedRetries ? "Connection Timeout" : "Connection Failed"}
            </Typography>
          </div>

          <Typography variant="body1" gutterBottom>
            {hasExhaustedRetries
              ? "Unable to establish connection after multiple attempts. Please check that the PenPal server is running."
              : "Unable to connect to the PenPal server. This usually happens when:"}
          </Typography>

          {!hasExhaustedRetries && (
            <Typography
              variant="body2"
              component="ul"
              style={{ textAlign: "left", margin: "16px 0" }}
            >
              <li>The server is still starting up</li>
              <li>There are network connectivity issues</li>
              <li>The GraphQL server is not running</li>
            </Typography>
          )}

          {currentRetry > 0 && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Retry attempt {currentRetry} of {maxRetries}
            </Typography>
          )}

          <div className={classes.errorMessage}>{error.message}</div>

          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            className={classes.retryButton}
            disabled={hasExhaustedRetries}
          >
            {hasExhaustedRetries ? "Max Retries Reached" : "Retry Connection"}
          </Button>

          {hasExhaustedRetries && (
            <Typography variant="body2" style={{ marginTop: 16, fontSize: 12 }}>
              Try refreshing the page or contact support if the problem
              persists.
            </Typography>
          )}
        </Paper>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <Paper className={classes.loadingBox}>
        <div className={classes.logo}>PenPal</div>

        <CircularProgress size={60} thickness={4} />

        <div className={classes.progressContainer}>
          <LinearProgress
            variant="determinate"
            value={progress}
            style={{ height: 6, borderRadius: 3 }}
          />
        </div>

        <Typography variant="body1" className={classes.statusText}>
          {status || "Initializing..."}
        </Typography>

        {currentRetry > 0 && (
          <Typography variant="body2" color="textSecondary">
            Retry attempt {currentRetry} of {maxRetries}
          </Typography>
        )}
      </Paper>
    </div>
  );
};

registerComponent("ApolloLoading", ApolloLoading);

export default ApolloLoading;
