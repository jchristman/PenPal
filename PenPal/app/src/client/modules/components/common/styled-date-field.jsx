import React, { useState } from "react";
import { Components, registerComponent } from "@penpal/core";
import { DesktopDatePicker } from "@mui/x-date-pickers";

const StyledDateField = ({
  margin = "normal",
  variant = "inline",
  format = "MM/DD/yyyy",
  value,
  onChange,
  ...rest
}) => {
  return (
    <DesktopDatePicker
      autoOk
      variant={variant}
      format={format}
      value={value}
      InputAdornmentProps={{ position: "start" }}
      onChange={onChange}
      TextFieldComponent={Components.StyledTextField}
      {...rest}
    />
  );
};

registerComponent("StyledDateField", StyledDateField);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default StyledDateField;
