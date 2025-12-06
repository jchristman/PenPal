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

import GetConfigurablePluginsQuery from "./queries/get-configurable-plugins.ts";
import GetProfiles from "./queries/get-profiles.ts";
import {
  UpsertPluginConfigInProfile,
  CreateProfile,
} from "./queries/profile-mutations.ts";

const Selector: React.FC = () => {
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

  const {
    loading: profiles_loading,
    data: { getPluginProfiles = [] } = {},
    refetch: refetchProfiles,
  } = useQuery(GetProfiles);

  const loading = introspection_loading || plugins_loading;

  const [selected, setSelected] = useState<string>("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [showCreateProfile, setShowCreateProfile] = useState<boolean>(false);
  const [creatingProfile, setCreatingProfile] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [newProfileDescription, setNewProfileDescription] = useState<string>("");

  const { configuration } = getConfigurablePlugins?.[selected]?.settings ?? {
    configuration: {
      schema_root: false,
      getter: false,
      setter: false,
    },
  };

  // -------- helpers -------- //
  const stripTypenameDeep = (value: any): any => {
    if (Array.isArray(value)) return value.map(stripTypenameDeep);
    if (value && typeof value === "object") {
      const next: any = {};
      for (const [k, v] of Object.entries(value)) {
        if (k === "__typename") continue;
        next[k] = stripTypenameDeep(v);
      }
      return next;
    }
    return value;
  };

  const sanitizeForPlugin = (pluginName: string | undefined, config: any) => {
    let next = stripTypenameDeep(_.cloneDeep(config));
    if (pluginName?.toLowerCase().includes("nmap")) {
      const normalizeScanMode = (mode?: any) => {
        if (!mode || typeof mode !== "object") return;
        const coercePorts = (val: any) => {
          if (Array.isArray(val)) return val.join(",");
          if (val === null || val === undefined) return "";
          return String(val);
        };
        if ("tcp_ports" in mode) mode.tcp_ports = coercePorts(mode.tcp_ports);
        if ("udp_ports" in mode) mode.udp_ports = coercePorts(mode.udp_ports);
      };
      if (next?.scan) {
        normalizeScanMode(next.scan.fast);
        normalizeScanMode(next.scan.detailed);
      }
    }
    return next;
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
  const [upsertProfileConfig, { loading: savingProfile }] = useMutation(
    UpsertPluginConfigInProfile
  );
  const [createProfile] = useMutation(CreateProfile);
  const [localConfig, setLocalConfig] = useState<any>({});
  const [configSinceLastSave, setConfigSinceLastSave] = useState<any>({});

  useEffect(() => {
    (async () => {
      if (!loading && configuration.getter !== false && selected !== "") {
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

  const handlePluginSelect = (pluginIndex: string): void => {
    setLocalConfig({});
    setSelected(pluginIndex);
    setSelectedProfileId("");
    setOpen(false);
  };

  const handleProfileSelect = (profileId: string): void => {
    setSelectedProfileId(profileId);
    // When a profile is chosen, load its stored config for this plugin into local state
    const pluginId = selected ? getConfigurablePlugins?.[selected]?.id : null;
    const profile = getPluginProfiles.find((p: any) => p.id === profileId);
    if (!profile) {
      setProfileOpen(false);
      return;
    }

    if (!pluginId) {
      // No plugin selected: just close; config will be applied once plugin is chosen
      setProfileOpen(false);
      return;
    }

    const match =
      profile.plugin_configs?.find(
        (pc: any) => pc.plugin_id === pluginId
      )?.configuration ?? {};

    setLocalConfig(match || {});
    setConfigSinceLastSave(match || {});
    setProfileOpen(false);
  };

  const handleConfigChange = (path: string, newValue: any): void => {
    // Need to clone the object so that the reference changes on setLocalConfig
    const newLocalConfig = _.cloneDeep(localConfig);
    _.set(newLocalConfig, path, newValue);
    setLocalConfig(newLocalConfig);
  };

  const config_has_changed_since_last_save =
    JSON.stringify(localConfig) !== JSON.stringify(configSinceLastSave);

  const handleSave = async (): Promise<void> => {
    const pluginName = getConfigurablePlugins?.[selected]?.name;
    const sanitized = sanitizeForPlugin(pluginName, localConfig);
    setConfigSinceLastSave(sanitized);
    try {
      const { __typename, ...newLocalConfig } =
        (
          await setConfig({
            variables: { configuration: sanitized },
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

  const handleSaveToProfile = async (): Promise<void> => {
    const pluginId = getConfigurablePlugins?.[selected]?.id;
    if (!pluginId || !selectedProfileId) return;

    const pluginName = getConfigurablePlugins?.[selected]?.name;
    const sanitized = sanitizeForPlugin(pluginName, localConfig);

    try {
      await upsertProfileConfig({
        variables: {
          profile_id: selectedProfileId,
          plugin_id: pluginId,
          configuration: sanitized,
        },
      });
      await refetchProfiles();
      toast({
        title: "Saved",
        description: "Configuration saved to profile",
      });
      setConfigSinceLastSave(sanitized);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateProfile = async (): Promise<void> => {
    if (!newProfileName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a profile name",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingProfile(true);
      const result = await createProfile({
        variables: {
          input: {
            name: newProfileName.trim(),
            description: newProfileDescription.trim() || null,
          },
        },
      });

      const created = result?.data?.createPluginProfile;
      await refetchProfiles();

      if (created?.id) {
        setSelectedProfileId(created.id);
      }

      toast({
        title: "Profile created",
        description: `Profile "${created?.name || newProfileName}" created`,
      });
      setShowCreateProfile(false);
      setNewProfileName("");
      setNewProfileDescription("");
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setCreatingProfile(false);
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

                <Components.Popover
                  open={profileOpen}
                  onOpenChange={setProfileOpen}
                >
                  <Components.PopoverTrigger asChild>
                    <Components.Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={profileOpen}
                      disabled={profiles_loading}
                      className="w-64 justify-between bg-white border border-gray-200 rounded-xl shadow-sm"
                    >
                      {profiles_loading
                        ? "Loading profiles..."
                        : selectedProfileId
                        ? getPluginProfiles.find(
                            (p: any) => p.id === selectedProfileId
                          )?.name || "Profile not found"
                        : "Select a profile..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Components.Button>
                  </Components.PopoverTrigger>
                  <Components.PopoverContent className="w-64 p-0 bg-white border border-gray-200 rounded-xl shadow-lg">
                    <Components.Command>
                      <Components.CommandInput
                        placeholder="Search profiles..."
                        className="h-9"
                      />
                      <Components.CommandList>
                        <Components.CommandEmpty>
                          No profiles found.
                        </Components.CommandEmpty>
                        {getPluginProfiles?.map((profile: any) => (
                          <Components.CommandItem
                            key={profile.id}
                            value={profile.name}
                            onSelect={() => handleProfileSelect(profile.id)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProfileId === profile.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {profile.name}
                          </Components.CommandItem>
                        ))}
                      </Components.CommandList>
                    </Components.Command>
                  </Components.PopoverContent>
                </Components.Popover>

                <Components.Button
                  variant="outline"
                  onClick={() => setShowCreateProfile((prev) => !prev)}
                  size="lg"
                >
                  {showCreateProfile ? "Cancel" : "New Profile"}
                </Components.Button>

            <Components.Button
              variant="default"
              disabled={!config_has_changed_since_last_save}
              onClick={handleSave}
              size="lg"
            >
              Save Configuration
            </Components.Button>
                <Components.Button
                  variant="secondary"
                  disabled={
                    selected === "" ||
                    selectedProfileId === "" ||
                    savingProfile ||
                    profiles_loading
                  }
                  onClick={handleSaveToProfile}
                  size="lg"
                >
                  {savingProfile ? "Saving..." : "Save to Profile"}
                </Components.Button>
          </div>

              {showCreateProfile && (
                <div className="mb-4 flex flex-col gap-3 p-4 border rounded-lg bg-white shadow-sm max-w-xl">
                  <div className="text-sm font-semibold">Create Profile</div>
                  <div className="flex flex-col gap-2">
                    <Components.Label htmlFor="new-profile-name">
                      Name
                    </Components.Label>
                    <Components.Input
                      id="new-profile-name"
                      placeholder="e.g. Default Scan Settings"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Components.Label htmlFor="new-profile-description">
                      Description (optional)
                    </Components.Label>
                    <Components.Input
                      id="new-profile-description"
                      placeholder="Short description"
                      value={newProfileDescription}
                      onChange={(e) => setNewProfileDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Components.Button
                      variant="default"
                      onClick={handleCreateProfile}
                      disabled={creatingProfile}
                    >
                      {creatingProfile ? "Creating..." : "Create Profile"}
                    </Components.Button>
                    <Components.Button
                      variant="ghost"
                      onClick={() => {
                        setShowCreateProfile(false);
                        setNewProfileName("");
                        setNewProfileDescription("");
                      }}
                    >
                      Cancel
                    </Components.Button>
                  </div>
                </div>
              )}

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
