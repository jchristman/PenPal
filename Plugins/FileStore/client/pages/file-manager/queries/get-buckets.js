import { gql } from "@apollo/client";

const GET_BUCKETS = gql`
  query GetBuckets {
    getBuckets {
      name
      createdAt
      fileCount
    }
  }
`;

export default GET_BUCKETS;
