import React, { useState } from "react";
import { Components, registerComponent, Hooks } from "meteor/penpal";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { grey, indigo } from "@material-ui/core/colors";
import TextField from "@material-ui/core/TextField";
import Divider from "@material-ui/core/Divider";
import MenuItem from "@material-ui/core/MenuItem";
import cx from "classnames";

import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import CreateNewCustomer from "./mutations/create-new-customer.js";
import GetCustomers from "./queries/get-customers.js";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    height: "100%",
    width: "100%"
  },
  form_field: {
    marginBottom: theme.spacing(2)
  },
  submit_container: {
    marginTop: theme.spacing(4)
  },
  submit: {
    width: 300
  }
}));

const NewCustomerForm = ({ newCustomerHook = () => null }) => {
  // ----------------------------------------------------
  const { useIntrospection } = Hooks;

  const classes = useStyles();
  const [customerName, setCustomerName] = useState("");
  const [customerIndustry, setCustomerIndustry] = useState("");
  const [newCustomerPending, setNewCustomerPending] = useState(false);
  const { loading, types } = useIntrospection();

  const [
    createNewCustomer,
    { loading: create_customer_loading, error: create_customer_error }
  ] = useMutation(CreateNewCustomer, {
    update(cache, { data: { createCustomer: new_customer } }) {
      const current_customers =
        cache.readQuery({ query: GetCustomers })?.getCustomers ?? [];
      const data = { getCustomers: [...current_customers, new_customer] };
      cache.writeQuery({
        query: GetCustomers,
        data
      });

      newCustomerHook(data.getCustomers, new_customer);
    }
  });

  // ----------------------------------------------------

  const industries = loading
    ? ["Loading industry values..."]
    : types.Industry.enumValues.map((value) => value.name);

  // ----------------------------------------------------

  const handleCustomerNameChange = (event) =>
    setCustomerName(event.target.value);
  const handleCustomerIndustryChange = (event) =>
    setCustomerIndustry(event.target.value);
  const submitNewCustomer = () => {
    setNewCustomerPending(true);
    createNewCustomer({
      variables: {
        name: customerName,
        industry: industries[customerIndustry]
      }
    });
    setCustomerName("");
    setCustomerIndustry("");
    setNewCustomerPending(false);
  };

  return (
    <div className={classes.root}>
      <Components.StyledTextField
        label={"Name"}
        value={customerName}
        onChange={handleCustomerNameChange}
        className={classes.form_field}
      />
      <Components.StyledSelect
        value={customerIndustry}
        onChange={handleCustomerIndustryChange}
        label="Industry"
        className={classes.form_field}
      >
        {industries.map((item, index) => (
          <MenuItem key={index} value={index}>
            {item}
          </MenuItem>
        ))}
      </Components.StyledSelect>
      <div className={classes.submit_container}>
        <Components.StyledButton
          classes={{ root: classes.submit }}
          disabled={customerName.length === 0 || customerIndustry === ""}
          color="primary"
          onClick={submitNewCustomer}
        >
          Submit
        </Components.StyledButton>
      </div>
    </div>
  );
};

registerComponent("NewCustomerForm", NewCustomerForm);
