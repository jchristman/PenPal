import React, { useState, useEffect } from "react";
import {
  Components,
  registerComponent,
  Hooks,
  GraphQLUtils
} from "meteor/penpal";
import _ from "lodash";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import { indigo } from "@material-ui/core/colors";
import cx from "classnames";

import { useQuery, useMutation } from "@apollo/client";
import { useSnackbar } from "notistack";

import GetConfigurablePluginsQuery from "./queries/get-configurable-plugins.js";

const useStyles = makeStyles((theme) => ({
  main: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column"
  },
  selectBox: {
    marginBottom: theme.spacing(2),
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
  },
  save_button: {
    marginLeft: theme.spacing(2)
  },
  flex: {
    flex: 1
  },
  select: {
    minWidth: 200,
    background: "white",
    color: indigo[75],
    fontWeight: 200,
    borderStyle: "none",
    borderWidth: 2,
    borderRadius: 12,
    paddingLeft: 24,
    paddingTop: 14,
    paddingBottom: 15,
    boxShadow: "0px 5px 8px -3px rgba(0,0,0,0.14)",
    "&:focus": {
      borderRadius: 12,
      background: "white",
      borderColor: indigo[100]
    }
  },
  icon: {
    color: indigo[300],
    right: 12,
    position: "absolute",
    userSelect: "none",
    pointerEvents: "none"
  },
  paper: {
    borderRadius: 12,
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
  }
}));

const Selector = () => {
  // ---------------------- Hooks ---------------------- //
  const { generateQueryFromSchema, generateMutationFromSchema } = GraphQLUtils;
  const { useIntrospection, useImperativeQuery } = Hooks;

  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  const {
    loading: introspection_loading,
    types,
    queries,
    mutations
  } = useIntrospection();

  const {
    loading: plugins_loading,
    data: { getConfigurablePlugins = [] } = {}
  } = useQuery(GetConfigurablePluginsQuery);

  const loading = introspection_loading || plugins_loading;

  const [selected, setSelected] = useState("");

  const { configuration } = getConfigurablePlugins?.[selected]?.settings ?? {
    configuration: {
      schema_root: false,
      getter: false,
      setter: false
    }
  };

  const query = generateQueryFromSchema(
    types,
    configuration.schema_root,
    configuration.getter
  );
  const mutation = generateMutationFromSchema(
    types,
    mutations,
    configuration.setter
  );

  const getConfig = useImperativeQuery(query);
  const [setConfig] = useMutation(mutation);
  const [localConfig, setLocalConfig] = useState({});
  const [configSinceLastSave, setConfigSinceLastSave] = useState({});

  useEffect(() => {
    (async () => {
      if (!loading && configuration.getter !== false) {
        try {
          const config =
            (await getConfig())?.data?.[configuration.getter] ?? {};
          delete config.__typename;
          setLocalConfig(config);
          setConfigSinceLastSave(config);
        } catch (e) {
          enqueueSnackbar(`Error: ${e.message}`, { variant: "error" });
        }
      }
    })();
  }, [loading, selected]);

  // ---------------------- Hooks ---------------------- //

  const handleChange = (event) => setSelected(event.target.value);
  const handleConfigChange = (path, newValue) => {
    // Need to clone the object so that the reference changes on setLocalConfig
    const newLocalConfig = _.cloneDeep(localConfig);
    _.set(newLocalConfig, path, newValue);
    setLocalConfig(newLocalConfig);
  };
  const config_has_changed_since_last_save =
    JSON.stringify(localConfig) !== JSON.stringify(configSinceLastSave);

  const handleSave = async () => {
    setConfigSinceLastSave(localConfig);
    try {
      const newLocalConfig =
        (
          await setConfig({
            variables: { configuration: JSON.stringify(localConfig) }
          })
        )?.data?.[configuration.setter] ?? {};
      delete newLocalConfig.__typename;
      setLocalConfig(newLocalConfig);
      setConfigSinceLastSave(newLocalConfig);
    } catch (e) {
      enqueueSnackbar(`Error: ${e.message}`, { variant: "error" });
    }
  };

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
    <div className={classes.main}>
      {loading ? (
        "Loading available plugins..."
      ) : (
        <>
          <div className={classes.selectBox}>
            <FormControl>
              <Select
                disableUnderline
                classes={{ root: classes.select }}
                MenuProps={menuProps}
                IconComponent={iconComponent}
                value={selected}
                onChange={handleChange}
              >
                {getConfigurablePlugins.map((plugin, index) => (
                  <MenuItem key={plugin.id} value={index}>
                    {plugin.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="primary"
              disabled={!config_has_changed_since_last_save}
              onClick={handleSave}
              className={classes.save_button}
              size="large"
            >
              Save Configuration
            </Button>
          </div>
          <Paper square className={classes.flex}>
            {selected === "" ? (
              "Select Plugin to configure...."
            ) : Object.keys(localConfig).length === 0 ? (
              "Loading configuration..."
            ) : (
              <Components.ConfigurationPage
                localConfig={localConfig}
                handleConfigChange={handleConfigChange}
              />
            )}
          </Paper>
        </>
      )}
    </div>
  );
};

registerComponent("ConfigurationSelector", Selector);
