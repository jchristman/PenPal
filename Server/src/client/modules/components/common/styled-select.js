import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "meteor/penpal";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { grey, indigo } from "@material-ui/core/colors";
import TextField from "@material-ui/core/TextField";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import cx from "classnames";
import { v4 as uuidv4 } from "uuid";

import { borderRadius } from "./styled-common.js";

const useStyles = makeStyles((theme) => ({
  select: {
    minWidth: 200,
    background: "white",
    color: indigo[75],
    fontWeight: 200,
    border: "1px solid rgba(0, 0, 0, 0.87)",
    borderColor: grey[400],
    borderRadius,
    marginTop: 8,
    paddingLeft: 16,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 20,
    boxShadow: "0px 5px 8px -3px rgba(0,0,0,0.14)",
    "&:focus": {
      backgroundColor: "white",
      borderRadius
    }
  },
  select_open: {
    borderColor: theme.palette.primary.main,
    boxShadow: "0 1px 4px 0 rgba(0,0,0,0.24)"
  },
  icon: {
    color: indigo[300],
    top: "calc(50% - 8px)",
    right: 12,
    position: "absolute",
    userSelect: "none",
    pointerEvents: "none"
  },
  paper: {
    borderRadius,
    marginTop: 8
  },
  list: {
    paddingTop: 0,
    paddingBottom: 0,
    background: "white",
    "& li": {
      fontWeight: 200,
      paddingTop: 12,
      paddingBottom: 12
    },
    "& li:hover": {
      background: indigo[100]
    },
    "& li.Mui-selected": {
      color: "white",
      background: indigo[400]
    },
    "& li.Mui-selected:hover": {
      background: indigo[500]
    }
  },
  input_label_root: {
    fontSize: "1rem",
    color: grey[700],
    marginLeft: "0.75rem"
  },
  input_label_error: {},
  input_label_focused: {},
  input_label_shrink: {
    transform: "translate(0, 1.5px) scale(1)"
  }
}));

const StyledSelect = ({
  value,
  onChange,
  children,
  placeholder = "",
  label = "",
  ...rest
}) => {
  const classes = useStyles();
  const [labelId, setLabelId] = useState(uuidv4()); // Random string to avoid collisions
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const iconComponent = (props) => {
    return <ExpandMoreIcon className={cx(props.className, classes.icon)} />;
  };

  const menuProps = {
    classes: {
      paper: classes.paper,
      list: classes.list
    },
    anchorOrigin: {
      vertical: "bottom",
      horizontal: "left"
    },
    transformOrigin: {
      vertical: "top",
      horizontal: "left"
    },
    getContentAnchorEl: null
  };

  return (
    <FormControl>
      {label.length > 0 && (
        <InputLabel
          id={labelId}
          shrink
          classes={{
            root: classes.input_label_root,
            error: classes.input_label_error,
            shrink: classes.input_label_shrink,
            focused: classes.input_label_focused
          }}
        >
          {label}
        </InputLabel>
      )}
      <Select
        labelId={labelId}
        disableUnderline
        classes={{ root: cx(classes.select, isOpen && classes.select_open) }}
        MenuProps={menuProps}
        IconComponent={iconComponent}
        displayEmpty
        value={value}
        onChange={onChange}
        onOpen={handleOpen}
        onClose={handleClose}
        {...rest}
      >
        {placeholder.length > 0 && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}
        {children}
      </Select>
    </FormControl>
  );
};

registerComponent("StyledSelect", StyledSelect);
