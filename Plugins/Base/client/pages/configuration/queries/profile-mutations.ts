import { gql } from "@apollo/client";

export const CreateProfile = gql`
  mutation CreatePluginProfile($input: CreatePluginProfileInput!) {
    createPluginProfile(input: $input) {
      id
      name
      description
      updated_at
    }
  }
`;

export const UpdateProfile = gql`
  mutation UpdatePluginProfile($id: ID!, $input: UpdatePluginProfileInput!) {
    updatePluginProfile(id: $id, input: $input) {
      id
      name
      description
      updated_at
    }
  }
`;

export const DeleteProfile = gql`
  mutation DeletePluginProfile($id: ID!) {
    deletePluginProfile(id: $id)
  }
`;

export const UpsertPluginConfigInProfile = gql`
  mutation UpsertPluginConfigInProfile(
    $profile_id: ID!
    $plugin_id: ID!
    $configuration: JSON!
  ) {
    upsertPluginConfigInProfile(
      profile_id: $profile_id
      plugin_id: $plugin_id
      configuration: $configuration
    ) {
      id
      name
      plugin_configs {
        plugin_id
        configuration
      }
    }
  }
`;

export const RemovePluginConfigFromProfile = gql`
  mutation RemovePluginConfigFromProfile($profile_id: ID!, $plugin_id: ID!) {
    removePluginConfigFromProfile(
      profile_id: $profile_id
      plugin_id: $plugin_id
    ) {
      id
      name
    }
  }
`;

export const ExportPluginProfile = gql`
  mutation ExportPluginProfile($id: ID!) {
    exportPluginProfile(id: $id)
  }
`;

export const ImportPluginProfile = gql`
  mutation ImportPluginProfile($profile: JSON!, $overwrite: Boolean) {
    importPluginProfile(profile: $profile, overwrite: $overwrite) {
      id
      name
      description
      updated_at
      plugin_configs {
        plugin_id
        configuration
      }
    }
  }
`;
