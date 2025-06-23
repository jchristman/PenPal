import React from "react";
import { makeStyles } from "@mui/styles";
import { Snackbar, Alert, Chip, CircularProgress } from "@mui/material";
import { Wifi, WifiOff, Sync, Warning, CheckCircle } from "@mui/icons-material";
import { registerComponent } from "@penpal/core";
import {
  useConnectionStatus,
  useWebSocketState,
  WS_CONNECTION_STATES,
} from "./websocket-utils.js";

const useStyles = makeStyles((theme) => ({
  chip: {
    margin: theme.spacing(0.5),
  },
  snackbar: {
    marginTop: theme.spacing(8), // Account for app bar
  },
  statusIcon: {
    fontSize: 16,
    marginRight: theme.spacing(0.5),
  },
  spinner: {
    width: "16px !important",
    height: "16px !important",
    marginRight: theme.spacing(0.5),
  },
}));

// Compact connection status chip for toolbars/status bars
const ConnectionStatusChip = ({ variant = "outlined", size = "small" }) => {
  const classes = useStyles();
  const { connectionState, isConnected } = useWebSocketState();

  const getChipProps = () => {
    switch (connectionState) {
      case WS_CONNECTION_STATES.CONNECTED:
        return {
          label: "Live",
          color: "success",
          icon: <CheckCircle className={classes.statusIcon} />,
        };
      case WS_CONNECTION_STATES.CONNECTING:
        return {
          label: "Connecting",
          color: "primary",
          icon: <CircularProgress className={classes.spinner} />,
        };
      case WS_CONNECTION_STATES.RECONNECTING:
        return {
          label: "Reconnecting",
          color: "warning",
          icon: <Sync className={classes.statusIcon} />,
        };
      case WS_CONNECTION_STATES.DISCONNECTED:
        return {
          label: "Offline",
          color: "default",
          icon: <WifiOff className={classes.statusIcon} />,
        };
      case WS_CONNECTION_STATES.FAILED:
        return {
          label: "Failed",
          color: "error",
          icon: <Warning className={classes.statusIcon} />,
        };
      default:
        return {
          label: "Unknown",
          color: "default",
          icon: <WifiOff className={classes.statusIcon} />,
        };
    }
  };

  const chipProps = getChipProps();

  return (
    <Chip
      {...chipProps}
      variant={variant}
      size={size}
      className={classes.chip}
    />
  );
};

// Full connection status notification
const ConnectionStatusNotification = ({
  autoHideDuration = 4000,
  showOnConnect = true,
  showOnDisconnect = true,
  showOnReconnecting = true,
}) => {
  const classes = useStyles();
  const { showStatus, statusMessage, connectionState } = useConnectionStatus();

  const getSeverity = () => {
    switch (connectionState) {
      case WS_CONNECTION_STATES.CONNECTED:
        return "success";
      case WS_CONNECTION_STATES.CONNECTING:
      case WS_CONNECTION_STATES.RECONNECTING:
        return "info";
      case WS_CONNECTION_STATES.DISCONNECTED:
        return "warning";
      case WS_CONNECTION_STATES.FAILED:
        return "error";
      default:
        return "info";
    }
  };

  const shouldShow = () => {
    if (!showStatus) return false;

    switch (connectionState) {
      case WS_CONNECTION_STATES.CONNECTED:
        return showOnConnect;
      case WS_CONNECTION_STATES.DISCONNECTED:
      case WS_CONNECTION_STATES.FAILED:
        return showOnDisconnect;
      case WS_CONNECTION_STATES.CONNECTING:
      case WS_CONNECTION_STATES.RECONNECTING:
        return showOnReconnecting;
      default:
        return true;
    }
  };

  if (!shouldShow()) {
    return null;
  }

  return (
    <Snackbar
      open={showStatus}
      autoHideDuration={
        connectionState === WS_CONNECTION_STATES.CONNECTED
          ? 2000
          : autoHideDuration
      }
      className={classes.snackbar}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert severity={getSeverity()} variant="filled">
        {statusMessage}
      </Alert>
    </Snackbar>
  );
};

// Connection debug panel for development
const ConnectionDebugPanel = () => {
  const { connectionState, isConnected } = useWebSocketState();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "8px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999,
      }}
    >
      WS: {connectionState} | Connected: {isConnected ? "✓" : "✗"}
    </div>
  );
};

// Register components
registerComponent("ConnectionStatusChip", ConnectionStatusChip);
registerComponent("ConnectionStatusNotification", ConnectionStatusNotification);
registerComponent("ConnectionDebugPanel", ConnectionDebugPanel);

export {
  ConnectionStatusChip,
  ConnectionStatusNotification,
  ConnectionDebugPanel,
};
export default ConnectionStatusNotification;
