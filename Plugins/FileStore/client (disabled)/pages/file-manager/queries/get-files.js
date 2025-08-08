import { gql } from "@apollo/client";

const GET_FILES = gql`
  query GetFiles($bucket: String!, $limit: Int, $offset: Int) {
    getFiles(bucket: $bucket, limit: $limit, offset: $offset) {
      id
      bucket
      name
      size
      contentType
      lastModified
      uploadedAt
      metadata
      downloadUrl
    }
  }
`;

export default GET_FILES;
