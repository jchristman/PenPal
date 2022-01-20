import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "meteor/penpal";
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { ApolloProvider } from "@apollo/client";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import moment from "moment";
import MomentUtils from "@date-io/moment";
moment.locale("en");

import apolloInit from "./apollo-init.js";

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
            <MuiPickersUtilsProvider
              libInstance={moment}
              utils={MomentUtils}
              locale="en"
            >
              <Components.ErrorBoundary>
                <Components.IntrospectionProvider>
                  <Components.AccountProvider>
                    <Components.ForceLogin>
                      <Components.Layout />
                    </Components.ForceLogin>
                  </Components.AccountProvider>
                </Components.IntrospectionProvider>
              </Components.ErrorBoundary>
            </MuiPickersUtilsProvider>
          </ApolloProvider>
        )}
      </BrowserRouter>
    </SnackbarProvider>
  );
};

registerComponent("Root", Root);
