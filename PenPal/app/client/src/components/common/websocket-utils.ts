import { useState, useEffect, useRef } from "react";

// WebSocket connection states
export const WS_CONNECTION_STATES = {
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  RECONNECTING: "RECONNECTING",
  FAILED: "FAILED",
} as const;

export type WSConnectionState = typeof WS_CONNECTION_STATES[keyof typeof WS_CONNECTION_STATES];

// Global WebSocket connection state
let globalWsState: WSConnectionState = WS_CONNECTION_STATES.DISCONNECTED;
let wsStateListeners = new Set<(state: WSConnectionState) => void>();

// Function to update global WebSocket state
export const setWebSocketState = (state: WSConnectionState): void => {
  globalWsState = state;
  wsStateListeners.forEach((listener) => listener(state));
};

// Hook to monitor WebSocket connection state
export const useWebSocketState = (): {
  connectionState: WSConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isDisconnected: boolean;
  isFailed: boolean;
} => {
  const [connectionState, setConnectionState] = useState<WSConnectionState>(globalWsState);

  useEffect(() => {
    const listener = (state: WSConnectionState) => setConnectionState(state);
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
interface SubscriptionWithFallbackOptions {
  pollInterval?: number;
  maxPollDuration?: number;
  onFallback?: () => void;
  onReconnect?: () => void;
  [key: string]: any;
}

export const useSubscriptionWithFallback = (
  subscriptionHook: any,
  fallbackQuery: any,
  options: SubscriptionWithFallbackOptions = {}
) => {
  const {
    pollInterval = 5000,
    maxPollDuration = 60000, // Stop polling after 1 minute
    onFallback = () => {},
    onReconnect = () => {},
    ...subscriptionOptions
  } = options;

  const { connectionState, isConnected } = useWebSocketState();
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [subscriptionError, setSubscriptionError] = useState<any>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxPollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the subscription when WebSocket is connected
  const subscriptionResult = subscriptionHook({
    ...subscriptionOptions,
    skip: !isConnected,
    onData: (data: any) => {
      setSubscriptionData(data);
      subscriptionOptions.onData?.(data);
    },
    onError: (error: any) => {
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
interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

export const createRetryMechanism = (config: RetryConfig = {}) => {
  const {
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 1.5,
    shouldRetry = () => true,
  } = config;

  return async (operation: (...args: any[]) => any, ...args: any[]) => {
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
