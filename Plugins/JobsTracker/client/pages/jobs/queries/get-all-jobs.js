import { gql } from "@apollo/client";

const GET_ALL_JOBS = gql`
  query GetAllJobs($limit: Int, $offset: Int, $filterMode: String) {
    getAllJobs(limit: $limit, offset: $offset, filterMode: $filterMode) {
      jobs {
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
      totalCount
      hasMore
    }
  }
`;

export default GET_ALL_JOBS;
