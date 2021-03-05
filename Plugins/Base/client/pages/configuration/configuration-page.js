import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "meteor/penpal";
import _ from "lodash";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import { useSnackbar } from "notistack";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  main: {
    padding: theme.spacing(1)
  },
  label: {
    textTransform: "capitalize"
  },
  configuration_option: {},
  section: {
    width: "100%"
  }
}));

const transform_key = (key) => key.replaceAll("_", " ");

const ConfigurationPageSection = ({
  handleConfigChange,
  path,
  config: { __typename, ...rest },
  depth = 0
}) => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  const is_error = __typename === "PenPalError";
  let messageEffectConditions = [];
  if (is_error) {
    messageEffectConditions = [rest.code, rest.message];
  }

  useEffect(() => {
    if (__typename === "PenPalError") {
      enqueueSnackbar(`Error ${rest.code}: ${rest.message}`, {
        variant: "error"
      });
    }
  }, messageEffectConditions);

  const keys = Object.keys(rest);
  const children = _.map(keys, (key) => {
    const key_path = `${path}.${key}`;
    switch (typeof rest[key]) {
      case "string":
        return (
          <TextField
            fullWidth
            className={classes.configuration_option}
            InputLabelProps={{ className: classes.label }}
            label={transform_key(key)}
            value={rest[key]}
            onChange={(event) =>
              handleConfigChange(key_path, event.target.value)
            }
            key={key_path}
          ></TextField>
        );
      case "boolean":
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={rest[key]}
                onChange={(event) =>
                  handleConfigChange(key_path, event.target.checked)
                }
              />
            }
            classes={{ label: classes.label }}
            label={transform_key(key)}
          />
        );
      case "number":
        return (
          <TextField
            fullWidth
            className={classes.configuration_option}
            InputLabelProps={{ className: classes.label }}
            type="number"
            label={transform_key(key)}
            value={rest[key]}
            onChange={(event) =>
              handleConfigChange(key_path, event.target.value)
            }
            key={key_path}
          ></TextField>
        );
      case "object":
        if (rest[key] === null) {
          return null;
        }
        return (
          <div className={classes.section}>
            <h3>{transform_key(key)}</h3>
            <ConfigurationPageSection
              key={key_path}
              handleConfigChange={handleConfigChange}
              path={key_path}
              depth={depth + 1}
              config={rest[key]}
            />
          </div>
        );
      default:
        return <p>'Unknown'</p>;
    }
  });

  return is_error ? null : children;
};

const ConfigurationPage = ({ localConfig, handleConfigChange }) => {
  const classes = useStyles();
  const [selectedTab, setSelectedTab] = useState(
    Object.keys(localConfig)?.[0] ?? ""
  );
  const handleChange = (event, newValue) => setSelectedTab(newValue);
  const config_items = Object.keys(localConfig);

  return (
    <>
      <AppBar position="static" color="default">
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {config_items.map((item) => (
            <Tab
              key={item}
              disabled={localConfig[item] === null}
              value={item}
              label={item.replace("_", " ")}
            />
          ))}
        </Tabs>
      </AppBar>

      {config_items.map((item) => (
        <div key={item} hidden={selectedTab !== item} className={classes.main}>
          {selectedTab === item && (
            <Grid container>
              <ConfigurationPageSection
                handleConfigChange={handleConfigChange}
                path={item}
                config={localConfig[item]}
              />
            </Grid>
          )}
        </div>
      ))}
    </>
  );
};

registerComponent("ConfigurationPage", ConfigurationPage);
