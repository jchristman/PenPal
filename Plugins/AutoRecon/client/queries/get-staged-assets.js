import { gql } from "@apollo/client";

const GetStagedAssets = gql`
  query GetStagedAssets($projectId: ID!) {
    getStagedAssets(projectId: $projectId) {
      id
      type
      value
      tool
      confidence
      classification
      metadata
      created_at
    }
  }
`;

export default GetStagedAssets;
