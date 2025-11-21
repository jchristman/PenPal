import { gql } from "@apollo/client";

const AcceptStagedAssets = gql`
  mutation AcceptStagedAssets($projectId: ID!, $assetIds: [ID!]!) {
    acceptStagedAssets(projectId: $projectId, assetIds: $assetIds) {
      accepted
      rejected
      errors
    }
  }
`;

export default AcceptStagedAssets;
