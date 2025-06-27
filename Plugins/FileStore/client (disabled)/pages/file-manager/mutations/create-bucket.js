import { gql } from "@apollo/client";

const CREATE_BUCKET = gql`
  mutation CreateBucket($name: String!) {
    createBucket(name: $name)
  }
`;

export default CREATE_BUCKET;
