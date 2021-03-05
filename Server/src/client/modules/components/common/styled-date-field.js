import React, { useState } from "react";
import { Components, registerComponent } from "meteor/penpal";
import { KeyboardDatePicker } from "@material-ui/pickers";

const StyledDateField = ({
  margin = "normal",
  variant = "inline",
  format = "MM/DD/yyyy",
  value,
  onChange,
  ...rest
}) => {
  return (
    <KeyboardDatePicker
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
