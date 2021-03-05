import React, { useState } from "react";
import { Components, registerComponent } from "meteor/penpal";
import _ from "lodash";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { grey, indigo } from "@material-ui/core/colors";
import TextField from "@material-ui/core/TextField";

import { borderRadius, textFieldWidth } from "./styled-common.js";

const useStyles = makeStyles((theme) => ({
  text_field_form_control: {
    "label + &": {
      marginTop: 24
    }
  },
  text_field_input_label_root: {
    color: grey[700],
    marginLeft: "0.75rem"
  },
  text_field_input_label_error: {},
  text_field_input_label_focused: {},
  text_field_input_label_shrink: {
    transform: "translate(0, 1.5px) scale(1)"
  },
  text_field_helper_text: {
    float: "left",
    clear: "left",
    marginLeft: "0.75rem"
  },
  round_input_root: {
    borderRadius,
    border: "1px solid",
    borderColor: grey[400],
    overflow: "hidden",
    backgroundColor: "#fff",
    boxShadow: "0px 5px 8px -3px rgba(0,0,0,0.14)",
    "&:hover": {
      borderColor: grey[500]
    },
    "& > svg": {
      color: grey[500]
    }
  },
  round_input_focused: {
    boxShadow: "0 1px 4px 0 rgba(0,0,0,0.24)",
    borderColor: theme.palette.primary.main,
    "&:hover": {
      borderColor: theme.palette.primary.main
    }
  },
  round_input_error: {
    backgroundColor: "#fff9f9",
    borderColor: "#ff5252",
    "&:hover": {
      borderColor: "#ff5252"
    }
  },
  round_input_disabled: {
    backgroundColor: grey[100]
  },
  round_input_input: {
    padding: "0.625rem 1rem",
    "&:not(:first-child)": {
      paddingLeft: "0.5rem"
    },
    "&:not(:last-child)": {
      paddingRight: "0.5rem"
    }
  }
}));

const StyledTextField = ({
  FormHelperTextProps = {},
  InputProps = {},
  InputLabelProps = {},
  ...props
}) => {
  const classes = useStyles();

  return (
    <TextField
      {...props}
      InputLabelProps={_.merge(InputLabelProps, {
        shrink: true,
        classes: {
          root: classes.text_field_input_label_root,
          error: classes.text_field_input_label_error,
          shrink: classes.text_field_input_label_shrink,
          focused: classes.text_field_input_label_focused
        }
      })}
      InputProps={_.merge(InputProps, {
        classes: {
          root: classes.round_input_root,
          error: classes.round_input_error,
          input: classes.round_input_input,
          focused: classes.round_input_focused,
          formControl: classes.text_field_form_control
        },
        disableUnderline: true
      })}
      FormHelperTextProps={_.merge(FormHelperTextProps, {
        classes: { root: classes.text_field_helper_text }
      })}
    />
  );
};

registerComponent("StyledTextField", StyledTextField);
