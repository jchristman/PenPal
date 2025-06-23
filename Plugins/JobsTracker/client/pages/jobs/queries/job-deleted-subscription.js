import { gql } from "@apollo/client";

const JOB_DELETED_SUBSCRIPTION = gql`
  subscription JobDeleted {
    jobDeleted
  }
`;

export default JOB_DELETED_SUBSCRIPTION;
