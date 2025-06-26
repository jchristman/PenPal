import React, { useState, useEffect } from "react";
import {
  Components,
  registerComponent,
  Hooks,
  Utils,
  GraphQLUtils,
} from "@penpal/core";
import { Check, ChevronsUpDown } from "lucide-react";
import _ from "lodash";

const { cn } = Utils;

import { useQuery, useMutation } from "@apollo/client";

import GetConfigurablePluginsQuery from "./queries/get-configurable-plugins.js";

const Selector = () => {
  // ---------------------- Hooks ---------------------- //
  const { generateQueryFromSchema, generateMutationFromSchema } = GraphQLUtils;
  const { useIntrospection, useImperativeQuery } = Hooks;

  const { toast } = Hooks.useToast();

  const {
    loading: introspection_loading,
    types,
    queries,
    mutations,
  } = useIntrospection();

  const {
    loading: plugins_loading,
    data: { getConfigurablePlugins = [] } = {},
  } = useQuery(GetConfigurablePluginsQuery);

  const loading = introspection_loading || plugins_loading;

  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);

  const { configuration } = getConfigurablePlugins?.[selected]?.settings ?? {
    configuration: {
      schema_root: false,
      getter: false,
      setter: false,
    },
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
          const { __typename, ...config } =
            (await getConfig())?.data?.[configuration.getter] ?? {};
          setLocalConfig(config);
          setConfigSinceLastSave(config);
        } catch (e) {
          console.error("Selector", e);
          toast({
            title: "Error",
            description: e.message,
            variant: "destructive",
          });
        }
      }
    })();
  }, [loading, selected]);

  // ---------------------- Handlers ---------------------- //

  const handlePluginSelect = (pluginIndex) => {
    setLocalConfig({});
    setSelected(pluginIndex);
    setOpen(false);
  };

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
      const { __typename, ...newLocalConfig } =
        (
          await setConfig({
            variables: { configuration: localConfig },
          })
        )?.data?.[configuration.setter] ?? {};
      setLocalConfig(newLocalConfig);
      setConfigSinceLastSave(newLocalConfig);
    } catch (e) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  // Get selected plugin for display
  const selectedPlugin =
    selected !== "" ? getConfigurablePlugins[selected] : null;

  return (
    <div className="w-full h-full flex flex-col">
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Components.Spinner className="w-6 h-6 mr-2" />
          Loading available plugins...
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-row items-center space-x-4">
            <Components.Popover open={open} onOpenChange={setOpen}>
              <Components.PopoverTrigger asChild>
                <Components.Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-64 justify-between bg-white border border-gray-200 rounded-xl shadow-sm"
                >
                  {selectedPlugin
                    ? selectedPlugin.name
                    : "Select a plugin to configure..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Components.Button>
              </Components.PopoverTrigger>
              <Components.PopoverContent className="w-64 p-0 bg-white border border-gray-200 rounded-xl shadow-lg">
                <Components.Command>
                  <Components.CommandInput
                    placeholder="Search plugins..."
                    className="h-9"
                  />
                  <Components.CommandList>
                    <Components.CommandEmpty>
                      No plugins found.
                    </Components.CommandEmpty>
                    {getConfigurablePlugins?.map((plugin, index) => (
                      <Components.CommandItem
                        key={plugin.id}
                        value={plugin.name}
                        onSelect={() => handlePluginSelect(index.toString())}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selected === index.toString()
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {plugin.name}
                      </Components.CommandItem>
                    ))}
                  </Components.CommandList>
                </Components.Command>
              </Components.PopoverContent>
            </Components.Popover>

            <Components.Button
              variant="default"
              disabled={!config_has_changed_since_last_save}
              onClick={handleSave}
              size="lg"
            >
              Save Configuration
            </Components.Button>
          </div>

          <Components.Card className="flex-1">
            <Components.CardContent className="p-6">
              {selected === "" ? (
                <div className="text-muted-foreground">
                  Select Plugin to configure...
                </div>
              ) : Object.keys(localConfig).length === 0 ? (
                <div className="flex items-center text-muted-foreground">
                  <Components.Spinner className="w-4 h-4 mr-2" />
                  Loading configuration...
                </div>
              ) : (
                <Components.ConfigurationPage
                  key={selected} // Janky way to re-mount when the config changes, for the active tab
                  localConfig={localConfig}
                  handleConfigChange={handleConfigChange}
                />
              )}
            </Components.CardContent>
          </Components.Card>
        </>
      )}
    </div>
  );
};

registerComponent("ConfigurationSelector", Selector);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Selector;
