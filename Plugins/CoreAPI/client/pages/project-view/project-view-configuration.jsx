import React, { useState } from "react";
import { Components, registerComponent, Hooks } from "@penpal/core";
import { useQuery, useMutation } from "@apollo/client";
import { Check, ChevronsUpDown } from "lucide-react";
import GetProfiles from "../../../../Base/client/pages/configuration/queries/get-profiles";
import { UpdateProfile } from "../../../../Base/client/pages/configuration/queries/profile-mutations";
import GetProjectDetails from "./queries/get-project-details";
import { UpdateProjectProfile } from "./queries/project-profile-mutations";
import {
  formatPluginConfig,
  getDetailedConfigSummary,
} from "./project-configuration-utils";

const { useToast } = Hooks;
const {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} = Components;

const ProjectViewConfiguration = ({ project, disable_polling }) => {
  const { toast } = useToast();
  const [selectedProfileId, setSelectedProfileId] = useState(
    project?.profile || ""
  );
  const [open, setOpen] = useState(false);

  // Query to get all profiles
  const {
    loading: profilesLoading,
    error: profilesError,
    data: profilesData,
    refetch: refetchProfiles,
  } = useQuery(GetProfiles, {
    pollInterval: disable_polling ? 0 : 30000, // Less frequent polling for profiles
  });

  // Query to get project details with profile
  const {
    loading: projectLoading,
    error: projectError,
    data: projectData,
    refetch: refetchProject,
  } = useQuery(GetProjectDetails, {
    pollInterval: disable_polling ? 0 : 15000,
    variables: { id: project.id },
  });

  // Mutation to update project profile
  const [updateProjectProfile] = useMutation(UpdateProjectProfile, {
    onCompleted: (data) => {
      toast({
        title: "Profile Updated",
        description: `Project profile has been updated successfully.`,
        variant: "default",
      });
      refetchProject();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const profiles = profilesData?.getPluginProfiles || [];
  const currentProject = projectData?.getProject || project;
  const currentProfile = profiles.find((p) => p.id === currentProject?.profile);

  const handleProfileChange = async (profileId) => {
    setSelectedProfileId(profileId);
    try {
      await updateProjectProfile({
        variables: {
          id: project.id,
          profile: profileId || null,
        },
      });
    } catch (error) {
      console.error("Failed to update project profile:", error);
    }
  };

  const renderProfileSummary = (profile) => {
    if (!profile) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No profile selected for this project.</p>
          <p className="text-sm mt-2">
            Select a profile to see plugin configurations.
          </p>
        </div>
      );
    }

    const pluginCount = profile.plugin_configs?.length || 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{profile.name}</h3>
            {profile.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {profile.description}
              </p>
            )}
          </div>
          <Badge variant="secondary">
            {pluginCount} plugin{pluginCount !== 1 ? "s" : ""} configured
          </Badge>
        </div>

        {profile.plugin_configs && profile.plugin_configs.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Configured Plugins
            </h4>
            <div className="grid gap-3">
              {profile.plugin_configs.map((config, index) => {
                const formattedConfig = formatPluginConfig(
                  config.plugin_id,
                  config.configuration
                );
                return (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col space-y-2 flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">
                            {formattedConfig.name}
                          </Badge>
                          <span className="text-sm font-medium">
                            {formattedConfig.summary}
                          </span>
                        </div>
                        {/* Show key configuration details for better understanding */}
                        <div className="text-xs text-muted-foreground ml-2">
                          {getDetailedConfigSummary(
                            config.plugin_id,
                            config.configuration
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No plugin configurations in this profile.</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Last updated: {new Date(profile.updated_at).toLocaleString()}
        </div>
      </div>
    );
  };

  if (profilesLoading || projectLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading configuration...</div>
      </div>
    );
  }

  if (profilesError || projectError) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive">
          Error loading configuration:{" "}
          {(profilesError || projectError)?.message}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            refetchProfiles();
            refetchProject();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Profile Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Project Profile Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Active Profile</label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between bg-white border border-gray-200 rounded-xl shadow-sm"
                >
                  {currentProfile
                    ? currentProfile.name
                    : "Select a profile for this project..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-white border border-gray-200 rounded-xl shadow-lg">
                <Command>
                  <CommandInput
                    placeholder="Search profiles..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No profiles found.</CommandEmpty>
                    <CommandItem
                      value=""
                      onSelect={() => {
                        handleProfileChange("");
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedProfileId === "" ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <span className="text-muted-foreground">
                        No Profile (Default Settings)
                      </span>
                    </CommandItem>
                    {profiles.map((profile) => (
                      <CommandItem
                        key={profile.id}
                        value={profile.name}
                        onSelect={() => {
                          handleProfileChange(profile.id);
                          setOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedProfileId === profile.id
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        <div className="flex items-center space-x-2">
                          <span>{profile.name}</span>
                          {profile.description && (
                            <span className="text-xs text-muted-foreground">
                              - {profile.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Summary</CardTitle>
        </CardHeader>
        <CardContent>{renderProfileSummary(currentProfile)}</CardContent>
      </Card>

      {/* Quick Actions */}
      {currentProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/configure-plugins", "_blank")}
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(currentProfile, null, 2)
                  );
                  toast({
                    title: "Copied",
                    description: "Profile configuration copied to clipboard",
                    variant: "default",
                  });
                }}
              >
                Copy Config
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

registerComponent("ProjectViewConfiguration", ProjectViewConfiguration);
export default ProjectViewConfiguration;
