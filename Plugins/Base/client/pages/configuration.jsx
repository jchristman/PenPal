import React, { useEffect, useMemo, useState } from "react";
import {
  Components,
  Hooks,
  GraphQLUtils,
  registerComponent,
} from "@penpal/core";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";

import GetConfigurablePluginsQuery from "./configuration/queries/get-configurable-plugins.js";
import GetDashboardablePluginsQuery from "./dashboard/queries/get-dashboardable-plugins.js";
import gql from "graphql-tag";

const GET_PLUGINS = gql`
  {
    getPlugins {
      id
      name
      version
    }
  }
`;

const Configuration = () => {
  const navigate = useNavigate();
  const { plugin_name } = useParams();

  const { useIntrospection, useImperativeQuery } = Hooks;
  const { generateQueryFromSchema, generateMutationFromSchema } = GraphQLUtils;
  const { toast } = Hooks.useToast();

  const {
    loading: introspection_loading,
    types,
    mutations,
  } = useIntrospection();

  const { loading: cfg_loading, data: { getConfigurablePlugins = [] } = {} } =
    useQuery(GetConfigurablePluginsQuery);
  const { data: { getDashboardablePlugins = [] } = {} } = useQuery(
    GetDashboardablePluginsQuery
  );
  const { data: { getPlugins = [] } = {} } = useQuery(GET_PLUGINS);

  const loading = introspection_loading || cfg_loading;

  // Sidebar selection mapping: /configure/:plugin_name -> item
  const selectedPlugin = useMemo(() => {
    if (!plugin_name) return null;
    return (
      getConfigurablePlugins.find(
        (p) => p.name.toLowerCase() === plugin_name.toLowerCase()
      ) || null
    );
  }, [plugin_name, getConfigurablePlugins]);

  // Build query/mutation for selected plugin
  const configuration = selectedPlugin?.settings?.configuration ?? {
    schema_root: false,
    getter: false,
    setter: false,
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

  const getConfig = Hooks.useImperativeQuery(query);
  const [setConfig] = useMutation(mutation);
  const [localConfig, setLocalConfig] = useState({});
  const [configSinceLastSave, setConfigSinceLastSave] = useState({});

  const stripTypenamesDeep = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(stripTypenamesDeep);
    }
    if (obj && typeof obj === "object") {
      const clone = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k === "__typename") continue;
        clone[k] = stripTypenamesDeep(v);
      }
      return clone;
    }
    return obj;
  };

  useEffect(() => {
    (async () => {
      if (loading) return;
      if (!selectedPlugin) return;
      try {
        const raw = (await getConfig())?.data?.[configuration.getter] ?? {};
        const config = stripTypenamesDeep(raw);
        setLocalConfig(config);
        setConfigSinceLastSave(config);
      } catch (e) {
        toast({
          title: "Error",
          description: e.message,
          variant: "destructive",
        });
      }
    })();
  }, [loading, selectedPlugin?.name]);

  const handleConfigChange = (path, newValue) => {
    const newLocalConfig = JSON.parse(JSON.stringify(localConfig));
    // simple lodash.set replacement
    const segments = path.split(".");
    let obj = newLocalConfig;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (!obj[seg] || typeof obj[seg] !== "object") obj[seg] = {};
      obj = obj[seg];
    }
    obj[segments[segments.length - 1]] = newValue;
    setLocalConfig(newLocalConfig);
  };

  const configChanged =
    JSON.stringify(localConfig) !== JSON.stringify(configSinceLastSave);

  const handleSave = async () => {
    setConfigSinceLastSave(localConfig);
    try {
      // Do not send UI metadata back to server
      const payload = stripTypenamesDeep(
        JSON.parse(JSON.stringify(localConfig))
      );
      if (payload.__ui) delete payload.__ui; // backward-compat cleanup
      if (payload._ui) delete payload._ui;

      // Normalize to GraphQL input types (tcp_ports/udp_ports expect String)
      const normalizePorts = (section) => {
        if (!section) return;
        ["tcp_ports", "udp_ports"].forEach((k) => {
          const v = section[k];
          if (Array.isArray(v)) {
            section[k] = v.join(",");
          } else if (v != null && typeof v !== "string") {
            section[k] = String(v);
          }
        });
        if (section.top_ports === "") section.top_ports = null;
        if (typeof section.top_ports === "string") {
          section.top_ports = Number(section.top_ports);
        }
      };
      if (payload.scan?.fast) normalizePorts(payload.scan.fast);
      if (payload.scan?.detailed) normalizePorts(payload.scan.detailed);

      const rawResult =
        (await setConfig({ variables: { configuration: payload } }))?.data?.[
          configuration.setter
        ] ?? {};
      const newLocalConfig = stripTypenamesDeep(rawResult);
      setLocalConfig(newLocalConfig);
      // update baseline to avoid full rerender flicker
      setConfigSinceLastSave(newLocalConfig);
      toast({
        title: "Saved",
        description: `${selectedPlugin.name} configuration saved`,
      });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const onSelectPlugin = (name) => navigate(`/configure/${name}`);

  return (
    <Components.Card className="w-full h-full">
      <Components.CardContent className="p-2 h-full">
        <div className="w-full h-full flex">
          {/* Sidebar */}
          <div className="w-64 pr-3 mr-3 border-r">
            <div className="p-2 font-semibold">Plugins</div>
            <div className="px-1 pb-2 space-y-1">
              {/* Dashboard link */}
              <Components.Button
                variant={!selectedPlugin ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => navigate("/configure")}
              >
                Dashboard
              </Components.Button>

              {getConfigurablePlugins.map((p) => (
                <Components.Button
                  key={p.id}
                  variant={
                    selectedPlugin?.name === p.name ? "default" : "ghost"
                  }
                  className="w-full justify-start"
                  onClick={() => onSelectPlugin(p.name)}
                >
                  {p.name}
                </Components.Button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">
                {selectedPlugin ? selectedPlugin.name : "Configuration"}
              </div>
              {selectedPlugin && (
                <Components.Button
                  disabled={!configChanged}
                  onClick={handleSave}
                >
                  Save Configuration
                </Components.Button>
              )}
            </div>

            {!selectedPlugin ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Components.Card className="p-4">
                  <div className="text-sm text-muted-foreground">
                    Loaded Plugins
                  </div>
                  <div className="text-2xl font-semibold">
                    {getPlugins.length}
                  </div>
                </Components.Card>
                <Components.Card className="p-4">
                  <div className="text-sm text-muted-foreground">
                    Configurable
                  </div>
                  <div className="text-2xl font-semibold">
                    {getConfigurablePlugins.length}
                  </div>
                </Components.Card>
                <Components.Card className="p-4">
                  <div className="text-sm text-muted-foreground">
                    Dashboardable
                  </div>
                  <div className="text-2xl font-semibold">
                    {getDashboardablePlugins.length}
                  </div>
                </Components.Card>
              </div>
            ) : Object.keys(localConfig).length === 0 ? (
              <div className="flex items-center text-muted-foreground">
                <Components.Spinner className="w-4 h-4 mr-2" /> Loading
                configuration...
              </div>
            ) : (
              <Components.ConfigurationPage
                key={selectedPlugin.name}
                localConfig={localConfig}
                handleConfigChange={handleConfigChange}
                // ConfigurationPage will read __ui metadata from localConfig
              />
            )}
          </div>
        </div>
      </Components.CardContent>
    </Components.Card>
  );
};

registerComponent("Configuration", Configuration);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Configuration;
