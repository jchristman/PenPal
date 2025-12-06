import { gql } from "@apollo/client";

const GetAutoReconConfiguration = gql`
  query GetAutoReconConfiguration($projectId: ID!) {
    getAutoReconConfiguration(projectId: $projectId) {
      project_id
      tools
      options
      updated_at
    }
  }
`;

export default GetAutoReconConfiguration;
