import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { ApolloProvider } from "@apollo/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
//import { MuiPickersUtilsProvider } from "@mui/lab";
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

  console.log(Components);

  return (
    <SnackbarProvider maxSnack={3}>
      <BrowserRouter>
        {loading ? null : (
          <ApolloProvider client={apolloClient}>
            <ThemeProvider theme={theme}>
              <Components.ErrorBoundary>
                <Components.IntrospectionProvider>
                  <Components.AccountProvider>
                    <Components.ForceLogin>
                      <Components.Layout />
                    </Components.ForceLogin>
                  </Components.AccountProvider>
                </Components.IntrospectionProvider>
              </Components.ErrorBoundary>
            </ThemeProvider>
          </ApolloProvider>
        )}
      </BrowserRouter>
    </SnackbarProvider>
  );
};

registerComponent("Root", Root);
