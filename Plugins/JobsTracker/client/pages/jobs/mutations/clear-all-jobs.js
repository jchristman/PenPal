import { gql } from "@apollo/client";

const CLEAR_ALL_JOBS = gql`
  mutation ClearAllJobs {
    clearAllJobs {
      deletedCount
      error
    }
  }
`;

export default CLEAR_ALL_JOBS;
