import React from "react";
import { SnackbarProvider, useSnackbar } from "notistack";

const Snack = ({ msg, variant }) => {
  const { enqueueSnackbar } = useSnackbar();
  return <div onClick={() => enqueueSnackbar(msg, { variant })}>Click me</div>;
};

const SetupSnackbar = (props) => (
  <SnackbarProvider maxSnacks={3}>
    <Snack {...props} />
  </SnackbarProvider>
);

export const Success = () => (
  <SetupSnackbar msg="Success message" variant="success" />
);

export const Info = () => <SetupSnackbar msg="Info message" variant="info" />;

export const Warning = () => (
  <SetupSnackbar msg="Warning message" variant="warning" />
);

export const Error = () => (
  <SetupSnackbar msg="Error message" variant="error" />
);

export default {
  title: "UI/Snackbar"
};
