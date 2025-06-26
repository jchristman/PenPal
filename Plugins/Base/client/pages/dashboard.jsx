import React, { useState, useEffect } from "react";
import {
  Components,
  registerComponent,
  Hooks,
  GraphQLUtils,
} from "@penpal/core";
import _ from "lodash";
import { useQuery } from "@apollo/client";

import GetDashboardablePluginsQuery from "./dashboard/queries/get-dashboardable-plugins.js";

const Dashboard = () => {
  // ---------------------- Hooks ---------------------- //
  const { generateQueryFromSchemas } = GraphQLUtils;
  const { useIntrospection, useImperativeQuery } = Hooks;

  const { toast } = Hooks.useToast();

  const { loading: introspection_loading, types } = useIntrospection();

  const {
    loading: plugins_loading,
    data: { getDashboardablePlugins = [] } = {},
  } = useQuery(GetDashboardablePluginsQuery);

  const loading = introspection_loading || plugins_loading;

  const query = generateQueryFromSchemas(
    types,
    getDashboardablePlugins?.map((dashboardable_plugin) => ({
      schema_root: dashboardable_plugin.settings.dashboard.schema_root,
      query_name: dashboardable_plugin.settings.dashboard.getter,
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
          toast({
            title: "Error",
            description: e.message,
            variant: "destructive",
          });
        }
      }
    })();
  }, [loading, query]);

  // ---------------------- Hooks ---------------------- //

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Components.DashboardComponents data={availableDashboardData} />
    </div>
  );
};

registerComponent("Dashboard", Dashboard);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Dashboard;
