import { gql } from "@apollo/client";

const GET_ALL_JOBS = gql`
  query GetAllJobs {
    getAllJobs {
      jobs {
        id
        name
        plugin
        progress
        statusText
        status
        stages {
          id
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
      totalCount
      hasMore
    }
  }
`;

export default GET_ALL_JOBS;
