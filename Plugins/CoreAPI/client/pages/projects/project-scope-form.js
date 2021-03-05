import React, { useState } from "react";
import { Components, registerComponent, Regex } from "meteor/penpal";
import _ from "lodash";
import cx from "classnames";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { grey, indigo } from "@material-ui/core/colors";

import Chip from "@material-ui/core/Chip";
import Divider from "@material-ui/core/Divider";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    height: "100%",
    width: "100%"
  },
  form_group: {
    display: "flex",
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-start",
    marginBottom: theme.spacing(1),
    width: "100%"
  },
  form_field: {
    marginRight: theme.spacing(1)
  },
  submit_container: {
    marginTop: theme.spacing(4)
  },
  submit: {
    width: 300
  },
  extra_bottom_margin: {
    marginBottom: 22
  },
  form_group_button: {
    marginBottom: 22
  },
  scope: {
    display: "flex",
    flexWrap: "wrap",
    boxSizing: "border-box",
    border: `1px solid ${grey[400]}`,
    width: "100%",
    maxWidth: "100%",
    color: grey[700],
    borderRadius: 8,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(1),

    "& > *": {
      marginTop: theme.spacing(1)
    }
  },
  scope_chip: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1)
  },
  subnet_mask_textfield: {
    width: 65,
    marginLeft: theme.spacing(1)
  },
  divider: {
    width: "70%",
    marginLeft: "15%",
    marginRight: "15%",
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(4)
  }
}));

const ProjectScopeForm = ({
  projectIPs,
  setProjectIPs,
  projectNetworks,
  setProjectNetworks
}) => {
  // ----------------------------------------------------

  const classes = useStyles();
  const [host, setHost] = useState("");
  const [network, setNetwork] = useState("");
  const [subnetMask, setSubnetMask] = useState(24);

  // ----------------------------------------------------

  const handleHostChange = (event) => setHost(event.target.value);
  const handleNetworkChange = (event) => setNetwork(event.target.value);
  const handleSubnetMaskChange = (event) => setSubnetMask(event.target.value);

  const handleAddHost = () => {
    const newProjectIPs = [host].concat(projectIPs);
    setProjectIPs(newProjectIPs);
    setHost("");
  };

  const handleRemoveHost = (ip) =>
    setProjectIPs(projectIPs.filter((_ip) => _ip !== ip));

  const handleAddNetwork = () => {
    const newProjectNetworks = [`${network}/${subnetMask}`].concat(
      projectNetworks
    );

    setProjectNetworks(newProjectNetworks);
    setNetwork("");
    setSubnetMask(24);
  };

  const handleRemoveNetwork = (_network) =>
    setProjectNetworks(
      projectNetworks.filter((__network) => __network !== _network)
    );

  // ----------------------------------------------------

  const host_is_valid =
    Regex.ip_address.test(host) && !_.includes(projectIPs, host);
  const host_error = host.length > 0 && !host_is_valid;
  const network_is_valid =
    Regex.ip_address.test(network) &&
    !_.includes(projectNetworks, `${network}/${subnetMask}`);
  const network_error = network.length > 0 && !network_is_valid;
  const mask_error =
    0 > subnetMask || 32 < subnetMask || subnetMask.length === 0;

  // ----------------------------------------------------

  return (
    <div className={classes.root}>
      <div className={classes.form_group}>
        <Components.StyledTextField
          error={host_error}
          helperText={
            host_error
              ? Regex.ip_address.test(host)
                ? "IP already added"
                : "Invalid IP"
              : ""
          }
          label="IP Address"
          value={host}
          onChange={handleHostChange}
          className={cx(
            classes.form_field,
            !host_error && classes.extra_bottom_margin
          )}
        />
        <Components.StyledButton
          color="primary"
          disabled={host.length === 0 || !host_is_valid}
          onClick={handleAddHost}
          classes={{ root: classes.form_group_button }}
        >
          Add Host
        </Components.StyledButton>
      </div>
      <div className={classes.scope}>
        {projectIPs.length === 0 ? (
          <div>No Hosts Provided</div>
        ) : (
          projectIPs.map((ip) => (
            <Chip
              key={ip}
              label={ip}
              className={classes.scope_chip}
              onDelete={handleRemoveHost.bind(this, ip)}
            />
          ))
        )}
      </div>

      <Divider className={classes.divider} />

      <div className={classes.form_group}>
        <Components.StyledTextField
          error={network_error}
          helperText={
            network_error
              ? Regex.ip_address.test(network)
                ? "Network already added"
                : "Invalid IP"
              : ""
          }
          label="Network Address"
          value={network}
          onChange={handleNetworkChange}
          className={cx(
            classes.form_field,
            !network_error && classes.extra_bottom_margin
          )}
        />
        {"/"}
        <Components.StyledTextField
          error={mask_error}
          label="Mask"
          value={subnetMask}
          onChange={handleSubnetMaskChange}
          className={cx(
            classes.form_field,
            classes.subnet_mask_textfield,
            !mask_error && classes.extra_bottom_margin
          )}
        />
        <Components.StyledButton
          color="primary"
          disabled={network.length === 0 || mask_error || network_error}
          onClick={handleAddNetwork}
          classes={{ root: classes.form_group_button }}
        >
          Add Network
        </Components.StyledButton>
      </div>
      <div className={classes.scope}>
        {projectNetworks.length === 0 ? (
          <div>No Networks Provided</div>
        ) : (
          projectNetworks.map((_network) => (
            <Chip
              key={_network}
              label={_network}
              className={classes.scope_chip}
              onDelete={handleRemoveNetwork.bind(this, _network)}
            />
          ))
        )}
      </div>
    </div>
  );
};

registerComponent("ProjectScopeForm", ProjectScopeForm);
