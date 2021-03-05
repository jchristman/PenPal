import React, { useState, useEffect } from "react";
import {
  Components,
  registerComponent,
  Hooks,
  GraphQLUtils
} from "meteor/penpal";
import _ from "lodash";
import { useSnackbar } from "notistack";
import { useQuery } from "@apollo/client";

import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import { makeStyles } from "@material-ui/core/styles";

import GetDashboardablePluginsQuery from "./dashboard/queries/get-dashboardable-plugins.js";

const useStyles = makeStyles((theme) => ({}));
const Dashboard = () => {
  // ---------------------- Hooks ---------------------- //
  const { generateQueryFromSchemas } = GraphQLUtils;
  const { useIntrospection, useImperativeQuery } = Hooks;

  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  const { loading: introspection_loading, types } = useIntrospection();

  const {
    loading: plugins_loading,
    data: { getDashboardablePlugins = [] } = {}
  } = useQuery(GetDashboardablePluginsQuery);

  const loading = introspection_loading || plugins_loading;

  const query = generateQueryFromSchemas(
    types,
    getDashboardablePlugins.map((dashboardable_plugin) => ({
      schema_root: dashboardable_plugin.settings.dashboard.schema_root,
      query_name: dashboardable_plugin.settings.dashboard.getter
    }))
  );

  const getDashboardData = useImperativeQuery(query);
  const [availableDashboardData, setAvailableDashboardData] = useState({});

  useEffect(() => {
    (async () => {
      if (!loading) {
        try {
          const dashboard = (await getDashboardData())?.data;
          const _availableDashboardData = {};
          _.each(dashboard, (query_data) => {
            _.each(query_data, (field, key) => {
              if (
                typeof field === "object" &&
                field.__typename === "DashboardableStatisticsTrendingInt"
              ) {
                _availableDashboardData[key] = field;
              }
            });
          });
          setAvailableDashboardData(_availableDashboardData);
        } catch (e) {
          enqueueSnackbar(`Error: ${e.message}`, { variant: "error" });
        }
      }
    })();
  }, [loading, query]);

  // ---------------------- Hooks ---------------------- //

  return (
    <Container maxWidth="lg">
      <Components.DashboardComponents data={availableDashboardData} />
    </Container>
  );
};

registerComponent("Dashboard", Dashboard);
