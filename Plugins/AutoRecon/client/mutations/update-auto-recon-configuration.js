import { gql } from "@apollo/client";

const UpdateAutoReconConfiguration = gql`
  mutation UpdateAutoReconConfiguration($projectId: ID!, $tools: JSON, $options: JSON) {
    updateAutoReconConfiguration(projectId: $projectId, tools: $tools, options: $options) {
      project_id
      tools
      options
      updated_at
    }
  }
`;

export default UpdateAutoReconConfiguration;
