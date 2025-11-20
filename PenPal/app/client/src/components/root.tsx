import React, { useState, useEffect, useCallback } from "react";
import { Components, Routes, registerComponent } from "@penpal/core";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { TooltipProvider } from "@radix-ui/react-tooltip";

(import.meta as any).glob("./*/*.jsx", { eager: true });
(import.meta as any).glob("./*/*.js", { eager: true });
(import.meta as any).glob("./*/*.tsx", { eager: true });
(import.meta as any).glob("./*/*.ts", { eager: true });

import apolloInit from "./apollo-init";
import { waitForServerHealth } from "./common/server-health-check.ts";
import {
  ConnectionStatusNotification,
  ConnectionDebugPanel,
} from "./common/connection-status.tsx";

// Ensure core components are loaded and registered
console.log("🔧 Root component loading core providers...");
import "./common/user-provider";
import "./common/introspection-provider";
import "./common/error-boundary";
import "./common/apollo-loading";

const Root: React.FC = () => {
  const [apolloClient, setApolloClient] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<string>("Initializing Apollo Client...");
  const [progress, setProgress] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);

  const initializeApollo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setStatus("Checking server connectivity...");

      // First, check if the server is reachable with health check
      const healthProgress = (statusText: string): void => {
        setStatus(statusText);
        setProgress(10);
      };

      try {
        await waitForServerHealth(15, 1000, healthProgress);
        setProgress(15);
      } catch (healthError) {
        console.warn(
          "Server health check failed, proceeding anyway:",
          healthError instanceof Error ? healthError.message : String(healthError)
        );
        setStatus("Server health check failed, attempting connection...");
      }

      const progressCallback = (statusText: string): void => {
        setStatus(statusText);
        // Simulate progress based on status
        switch (statusText) {
          case "Connecting to GraphQL server...":
            setProgress(25);
            break;
          case "Setting up Apollo Client cache...":
            setProgress(55);
            break;
          case "Setting up authentication...":
            setProgress(70);
            break;
          case "Setting up HTTP connection...":
            setProgress(80);
            break;
          case "Setting up WebSocket connection...":
            setProgress(90);
            break;
          case "Finalizing Apollo Client setup...":
            setProgress(98);
            break;
          default:
            break;
        }
      };

      const client = await apolloInit(progressCallback);
      setApolloClient(client);
      setProgress(100);
      setStatus("Connected successfully!");

      // Brief delay to show success state
      setTimeout(() => {
        setLoading(false);
      }, 500);

      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Failed to initialize Apollo Client:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
      setRetryCount((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    initializeApollo();
  }, [initializeApollo]);

  const handleRetry = (): void => {
    if (retryCount < 10) {
      initializeApollo();
    } else {
      // Reset retry count and try again for manual retries
      setRetryCount(0);
      initializeApollo();
    }
  };

  // Show loading/error state
  if (loading || error) {
    return (
      <BrowserRouter>
        <Components.ApolloLoading
          status={status}
          error={error}
          onRetry={handleRetry}
          progress={progress}
          currentRetry={retryCount}
          maxRetries={10}
        />
        <Components.Toaster />
      </BrowserRouter>
    );
  }

  // Show main app when Apollo client is ready
  return (
    <BrowserRouter>
      <ApolloProvider client={apolloClient}>
        <TooltipProvider>
          <Components.ErrorBoundary>
            <Components.IntrospectionProvider>
              <Components.AccountProvider>
                <Components.Layout routes={Routes} />
              </Components.AccountProvider>
            </Components.IntrospectionProvider>
          </Components.ErrorBoundary>
          {/* WebSocket connection status notifications */}
          <ConnectionStatusNotification
            showOnConnect={true}
            showOnDisconnect={true}
            showOnReconnecting={true}
          />
          <Components.Toaster />
        </TooltipProvider>
      </ApolloProvider>
    </BrowserRouter>
  );
};

registerComponent("Root", Root);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Root;
