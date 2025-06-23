import { gql } from "@apollo/client";

const JOBS_SUBSCRIPTION = gql`
  subscription JobUpdated {
    jobUpdated {
      id
      name
      plugin
      progress
      statusText
      status
      stages {
        name
        plugin
        progress
        statusText
        status
        order
      }
      created_at
      updated_at
      project_id
    }
  }
`;

export default JOBS_SUBSCRIPTION;
