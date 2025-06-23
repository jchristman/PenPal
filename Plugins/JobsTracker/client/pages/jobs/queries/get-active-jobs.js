import { gql } from "@apollo/client";

const GET_ACTIVE_JOBS = gql`
  query GetActiveJobs {
    getActiveJobs {
      id
      name
      plugin
      progress
      status
      updated_at
    }
  }
`;

export default GET_ACTIVE_JOBS;
