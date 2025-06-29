import React, { useState, useEffect, useCallback } from "react";
import { Components, registerComponent } from "@penpal/core";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { ApolloProvider } from "@apollo/client";
import {
  ThemeProvider,
  createTheme,
  StyledEngineProvider,
} from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
moment.locale("en");

import.meta.glob("./*/*.jsx", { eager: true });
import.meta.glob("./*/*.js", { eager: true });

import apolloInit from "./apollo-init.js";
import { waitForServerHealth } from "./common/server-health-check.js";
import {
  ConnectionStatusNotification,
  ConnectionDebugPanel,
} from "./common/connection-status.jsx";

const theme = createTheme();

const Root = () => {
  const [apolloClient, setApolloClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("Initializing Apollo Client...");
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const initializeApollo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setStatus("Checking server connectivity...");

      // First, check if the server is reachable with health check
      const healthProgress = (statusText) => {
        setStatus(statusText);
        setProgress(10);
      };

      try {
        await waitForServerHealth(15, 1000, healthProgress);
        setProgress(15);
      } catch (healthError) {
        console.warn(
          "Server health check failed, proceeding anyway:",
          healthError.message
        );
        setStatus("Server health check failed, attempting connection...");
      }

      const progressCallback = (statusText) => {
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
      setError(err);
      setLoading(false);
      setRetryCount((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    initializeApollo();
  }, [initializeApollo]);

  const handleRetry = () => {
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
      <SnackbarProvider maxSnack={3}>
        <BrowserRouter>
          <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
              <Components.ApolloLoading
                status={status}
                error={error}
                onRetry={handleRetry}
                progress={progress}
                currentRetry={retryCount}
                maxRetries={10}
              />
            </ThemeProvider>
          </StyledEngineProvider>
        </BrowserRouter>
      </SnackbarProvider>
    );
  }

  // Show main app when Apollo client is ready
  return (
    <SnackbarProvider maxSnack={3}>
      <BrowserRouter>
        <ApolloProvider client={apolloClient}>
          <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <Components.ErrorBoundary>
                  <Components.IntrospectionProvider>
                    <Components.AccountProvider>
                      <Components.ForceLogin>
                        <Components.Layout />
                      </Components.ForceLogin>
                    </Components.AccountProvider>
                  </Components.IntrospectionProvider>
                </Components.ErrorBoundary>
                {/* WebSocket connection status notifications */}
                <ConnectionStatusNotification
                  showOnConnect={true}
                  showOnDisconnect={true}
                  showOnReconnecting={true}
                />
              </LocalizationProvider>
            </ThemeProvider>
          </StyledEngineProvider>
        </ApolloProvider>
      </BrowserRouter>
    </SnackbarProvider>
  );
};

registerComponent("Root", Root);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Root;
