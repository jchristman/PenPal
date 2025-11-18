import { gql } from "@apollo/client";

const StartAutoReconScan = gql`
  mutation StartAutoReconScan($projectId: ID!) {
    startAutoReconScan(projectId: $projectId) {
      id
      project_id
      created_at
      updated_at
    }
  }
`;

export default StartAutoReconScan;
