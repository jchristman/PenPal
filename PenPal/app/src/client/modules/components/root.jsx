import React, { useState, useEffect } from "react";
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

const theme = createTheme();

const removeLoadingDiv = () => {
  document.getElementById("loading").remove();
};

const Root = () => {
  const [apolloClient, setApolloClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setApolloClient(await apolloInit());
      setLoading(false);
      removeLoadingDiv();
    })();
  }, []);

  return (
    <SnackbarProvider maxSnack={3}>
      <BrowserRouter>
        {loading ? null : (
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
                </LocalizationProvider>
              </ThemeProvider>
            </StyledEngineProvider>
          </ApolloProvider>
        )}
      </BrowserRouter>
    </SnackbarProvider>
  );
};

registerComponent("Root", Root);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Root;
