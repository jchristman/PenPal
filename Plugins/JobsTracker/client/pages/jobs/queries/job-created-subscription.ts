import { gql } from "@apollo/client";

const JOB_CREATED_SUBSCRIPTION = gql`
  subscription JobCreated {
    jobCreated {
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

export default JOB_CREATED_SUBSCRIPTION;
