import { gql } from "@apollo/client";

const RejectStagedAssets = gql`
  mutation RejectStagedAssets($projectId: ID!, $assetIds: [ID!]!) {
    rejectStagedAssets(projectId: $projectId, assetIds: $assetIds) {
      accepted
      rejected
      errors
    }
  }
`;

export default RejectStagedAssets;
