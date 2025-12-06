import { gql } from "@apollo/client";

const ACTIVE_JOBS_SUBSCRIPTION = gql`
  subscription ActiveJobsChanged {
    activeJobsChanged {
      id
      name
      plugin
      progress
      status
      updated_at
    }
  }
`;

export default ACTIVE_JOBS_SUBSCRIPTION;
