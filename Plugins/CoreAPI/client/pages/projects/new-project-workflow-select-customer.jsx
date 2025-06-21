import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "@penpal/core";
import _ from "lodash";
import { makeStyles, useTheme } from "@mui/styles";
import { indigo } from "@mui/material/colors";
import Select from "@mui/material/Select";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import cx from "classnames";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  pane: {
    height: `calc(100% - ${theme.spacing(4)}px)`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    margin: theme.spacing(2),
  },
  pane_title: {
    color: "#555",
    fontSize: 17,
    textTransform: "uppercase",
    width: "100%",
    textAlign: "center",
    marginBottom: theme.spacing(1),
  },
  pane_rest: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  divider: {
    margin: theme.spacing(2),
  },
}));

const SelectCustomer = ({
  enableNext = () => null,
  disableNext = () => null,
  selectedCustomer,
  setSelectedCustomer,
  customers,
}) => {
  // ----------------------------------------------------

  const classes = useStyles();

  useEffect(() => {
    if (selectedCustomer !== "") {
      enableNext();
    } else {
      disableNext();
    }
  }, [selectedCustomer]);

  // ----------------------------------------------------

  const handleChange = (event) => setSelectedCustomer(event.target.value);
  const handleNewCustomer = (all_customers, new_customer) => {
    const new_customer_index = _.findIndex(
      all_customers,
      (customer) => customer.id === new_customer.id
    );

    // Delay this by a scosh to avoid a warning on the race condition
    setTimeout(() => setSelectedCustomer(new_customer_index), 50);
  };

  // ----------------------------------------------------

  return (
    <div className={classes.root}>
      <div className={classes.pane}>
        <div className={classes.pane_title}>Select Customer</div>
        <div className={classes.pane_rest}>
          <Components.StyledSelect
            value={selectedCustomer}
            onChange={handleChange}
          >
            {customers.length === 0 && (
              <MenuItem value="" disabled>
                No customers found
              </MenuItem>
            )}
            {customers.map((customer, index) => (
              <MenuItem key={customer.id} value={index}>
                {customer.name}
              </MenuItem>
            ))}
          </Components.StyledSelect>
        </div>
      </div>
      <Divider flexItem orientation="vertical" className={classes.divider} />
      <div className={classes.pane}>
        <div className={classes.pane_title}>New Customer</div>
        <div className={classes.pane_rest}>
          <Components.NewCustomerForm newCustomerHook={handleNewCustomer} />
        </div>
      </div>
    </div>
  );
};

registerComponent("NewProjectWorkflowSelectCustomer", SelectCustomer);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default SelectCustomer;
