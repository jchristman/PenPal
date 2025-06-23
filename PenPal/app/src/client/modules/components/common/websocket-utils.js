import { useState, useEffect, useRef } from "react";

// WebSocket connection states
export const WS_CONNECTION_STATES = {
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  RECONNECTING: "RECONNECTING",
  FAILED: "FAILED",
};

// Global WebSocket connection state
let globalWsState = WS_CONNECTION_STATES.DISCONNECTED;
let wsStateListeners = new Set();

// Function to update global WebSocket state
export const setWebSocketState = (state) => {
  globalWsState = state;
  wsStateListeners.forEach((listener) => listener(state));
};

// Hook to monitor WebSocket connection state
export const useWebSocketState = () => {
  const [connectionState, setConnectionState] = useState(globalWsState);

  useEffect(() => {
    const listener = (state) => setConnectionState(state);
    wsStateListeners.add(listener);

    return () => {
      wsStateListeners.delete(listener);
    };
  }, []);

  return {
    connectionState,
    isConnected: connectionState === WS_CONNECTION_STATES.CONNECTED,
    isConnecting: connectionState === WS_CONNECTION_STATES.CONNECTING,
    isReconnecting: connectionState === WS_CONNECTION_STATES.RECONNECTING,
    isDisconnected: connectionState === WS_CONNECTION_STATES.DISCONNECTED,
    isFailed: connectionState === WS_CONNECTION_STATES.FAILED,
  };
};

// Hook for automatic fallback to polling when WebSocket fails
export const useSubscriptionWithFallback = (
  subscriptionHook,
  fallbackQuery,
  options = {}
) => {
  const {
    pollInterval = 5000,
    maxPollDuration = 60000, // Stop polling after 1 minute
    onFallback = () => {},
    onReconnect = () => {},
    ...subscriptionOptions
  } = options;

  const { connectionState, isConnected } = useWebSocketState();
  const [isPolling, setIsPolling] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const pollTimeoutRef = useRef(null);
  const maxPollTimeoutRef = useRef(null);

  // Use the subscription when WebSocket is connected
  const subscriptionResult = subscriptionHook({
    ...subscriptionOptions,
    skip: !isConnected,
    onData: (data) => {
      setSubscriptionData(data);
      subscriptionOptions.onData?.(data);
    },
    onError: (error) => {
      setSubscriptionError(error);
      subscriptionOptions.onError?.(error);
    },
  });

  // Fallback query for polling
  const fallbackResult = fallbackQuery({
    skip: isConnected || !isPolling,
    pollInterval: isPolling ? pollInterval : 0,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  useEffect(() => {
    if (!isConnected && connectionState !== WS_CONNECTION_STATES.CONNECTING) {
      // Start polling fallback
      if (!isPolling) {
        console.log("🔄 WebSocket disconnected, starting polling fallback");
        setIsPolling(true);
        onFallback();

        // Set maximum polling duration
        maxPollTimeoutRef.current = setTimeout(() => {
          console.log("⏱️ Stopping polling fallback after maximum duration");
          setIsPolling(false);
        }, maxPollDuration);
      }
    } else if (isConnected && isPolling) {
      // Stop polling and resume subscription
      console.log("✅ WebSocket reconnected, stopping polling fallback");
      setIsPolling(false);
      if (maxPollTimeoutRef.current) {
        clearTimeout(maxPollTimeoutRef.current);
        maxPollTimeoutRef.current = null;
      }
      onReconnect();
    }

    return () => {
      if (maxPollTimeoutRef.current) {
        clearTimeout(maxPollTimeoutRef.current);
      }
    };
  }, [
    isConnected,
    connectionState,
    isPolling,
    onFallback,
    onReconnect,
    maxPollDuration,
  ]);

  return {
    // Connection state
    connectionState,
    isConnected,
    isPolling,

    // Data from either subscription or polling
    data: isConnected ? subscriptionData : fallbackResult.data,
    loading: isConnected ? subscriptionResult.loading : fallbackResult.loading,
    error: isConnected ? subscriptionError : fallbackResult.error,

    // Original hook results for advanced usage
    subscriptionResult,
    fallbackResult,
  };
};

// Hook to show connection status to users
export const useConnectionStatus = () => {
  const { connectionState, isConnected } = useWebSocketState();
  const [showStatus, setShowStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    switch (connectionState) {
      case WS_CONNECTION_STATES.CONNECTING:
        setStatusMessage("Connecting to real-time updates...");
        setShowStatus(true);
        break;
      case WS_CONNECTION_STATES.RECONNECTING:
        setStatusMessage("Reconnecting to real-time updates...");
        setShowStatus(true);
        break;
      case WS_CONNECTION_STATES.DISCONNECTED:
        setStatusMessage(
          "Real-time updates disconnected. Using periodic refresh."
        );
        setShowStatus(true);
        break;
      case WS_CONNECTION_STATES.FAILED:
        setStatusMessage(
          "Unable to connect for real-time updates. Using periodic refresh."
        );
        setShowStatus(true);
        break;
      case WS_CONNECTION_STATES.CONNECTED:
        setStatusMessage("Connected to real-time updates");
        setShowStatus(true);
        // Hide success message after 2 seconds
        setTimeout(() => setShowStatus(false), 2000);
        break;
      default:
        setShowStatus(false);
    }
  }, [connectionState]);

  return {
    showStatus,
    statusMessage,
    connectionState,
    isConnected,
  };
};

// Utility function to create a retry mechanism for any async operation
export const createRetryMechanism = (config = {}) => {
  const {
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 1.5,
    shouldRetry = () => true,
  } = config;

  return async (operation, ...args) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation(...args);
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !shouldRetry(error, attempt)) {
          throw error;
        }

        const delay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );

        console.log(
          `Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };
};
