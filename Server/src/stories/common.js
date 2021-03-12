import React from "react";
import path from "path";

import { registerStorybookMocks } from "meteor/penpal";
import mocks from "./mocks";
registerStorybookMocks("Server", mocks);

import "./require_all_files.js";
import { Components, StorybookMocks } from "meteor/penpal";

// Testable components
import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider, useSnackbar } from "notistack";
import { MockedProvider } from "@apollo/client/testing";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import moment from "moment";
import MomentUtils from "@date-io/moment";
moment.locale("en");

export const SetupProviders = ({ children }) => (
  <SnackbarProvider maxSnacks={3}>
    <BrowserRouter>
      <MockedProvider mocks={StorybookMocks} addTypename={false}>
        <MuiPickersUtilsProvider
          libInstance={moment}
          utils={MomentUtils}
          locale="en"
        >
          <Components.IntrospectionProvider>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.1)",
                padding: 8
              }}
            >
              <div
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                {children}
              </div>
            </div>
          </Components.IntrospectionProvider>
        </MuiPickersUtilsProvider>
      </MockedProvider>
    </BrowserRouter>
  </SnackbarProvider>
);
