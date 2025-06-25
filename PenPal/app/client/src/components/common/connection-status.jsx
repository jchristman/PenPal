import React from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";
import {
  useConnectionStatus,
  useWebSocketState,
  WS_CONNECTION_STATES,
} from "./websocket-utils.js";

// Compact connection status chip for toolbars/status bars
const ConnectionStatusChip = ({ variant = "outline", size = "sm" }) => {
  const { connectionState, isConnected } = useWebSocketState();

  const getBadgeProps = () => {
    switch (connectionState) {
      case WS_CONNECTION_STATES.CONNECTED:
        return {
          children: (
            <>
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Live
            </>
          ),
          variant: "default",
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case WS_CONNECTION_STATES.CONNECTING:
        return {
          children: (
            <>
              <Components.Spinner className="w-3 h-3 mr-1" />
              Connecting
            </>
          ),
          variant: "outline",
          className: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case WS_CONNECTION_STATES.RECONNECTING:
        return {
          children: (
            <>
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
              Reconnecting
            </>
          ),
          variant: "outline",
          className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        };
      case WS_CONNECTION_STATES.DISCONNECTED:
        return {
          children: (
            <>
              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
              Offline
            </>
          ),
          variant: "secondary",
          className: "bg-gray-100 text-gray-600 border-gray-200",
        };
      case WS_CONNECTION_STATES.FAILED:
        return {
          children: (
            <>
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
              Failed
            </>
          ),
          variant: "destructive",
          className: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return {
          children: (
            <>
              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
              Unknown
            </>
          ),
          variant: "secondary",
          className: "bg-gray-100 text-gray-600 border-gray-200",
        };
    }
  };

  const badgeProps = getBadgeProps();

  return (
    <Components.Badge
      variant={badgeProps.variant}
      className={`text-xs px-2 py-1 ${badgeProps.className}`}
    >
      {badgeProps.children}
    </Components.Badge>
  );
};

// Full connection status notification using toast system
const ConnectionStatusNotification = ({
  autoHideDuration = 4000,
  showOnConnect = true,
  showOnDisconnect = true,
  showOnReconnecting = true,
}) => {
  const { toast } = Hooks.useToast();
  const { showStatus, statusMessage, connectionState } = useConnectionStatus();
  const [lastNotifiedState, setLastNotifiedState] = React.useState(null);

  React.useEffect(() => {
    if (!showStatus || connectionState === lastNotifiedState) return;

    const shouldShow = () => {
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

    if (shouldShow()) {
      const getToastVariant = () => {
        switch (connectionState) {
          case WS_CONNECTION_STATES.CONNECTED:
            return "default";
          case WS_CONNECTION_STATES.CONNECTING:
          case WS_CONNECTION_STATES.RECONNECTING:
            return "default";
          case WS_CONNECTION_STATES.DISCONNECTED:
            return "destructive";
          case WS_CONNECTION_STATES.FAILED:
            return "destructive";
          default:
            return "default";
        }
      };

      toast({
        title: "Connection Status",
        description: statusMessage,
        variant: getToastVariant(),
        duration:
          connectionState === WS_CONNECTION_STATES.CONNECTED
            ? 2000
            : autoHideDuration,
      });

      setLastNotifiedState(connectionState);
    }
  }, [
    showStatus,
    statusMessage,
    connectionState,
    showOnConnect,
    showOnDisconnect,
    showOnReconnecting,
    toast,
    autoHideDuration,
    lastNotifiedState,
  ]);

  // This component doesn't render anything visible - it just triggers toasts
  return null;
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
