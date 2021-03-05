import React from "react";
import { storiesOf } from "@storybook/react";

import { SnackbarProvider, useSnackbar } from "notistack";

const Snack = ({ msg, variant }) => {
  const { enqueueSnackbar } = useSnackbar();
  return <div onClick={() => enqueueSnackbar(msg, { variant })}>Click me</div>;
};

const SetupSnackbar = props => (
  <SnackbarProvider maxSnacks={3}>
    <Snack {...props} />
  </SnackbarProvider>
);

const snackbar = storiesOf("UI/Snackbar", module);
snackbar.add("Success", () => (
  <SetupSnackbar msg="Success message" variant="success" />
));
snackbar.add("Info", () => <SetupSnackbar msg="Info message" variant="info" />);
snackbar.add("Warning", () => (
  <SetupSnackbar msg="Warning message" variant="warning" />
));
snackbar.add("Error", () => (
  <SetupSnackbar msg="Error message" variant="error" />
));
