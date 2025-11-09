import { gql } from "@apollo/client";

const GetProfiles = gql`
  query GetPluginProfiles {
    getPluginProfiles {
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

export default GetProfiles;
