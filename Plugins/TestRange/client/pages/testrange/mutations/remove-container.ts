import { gql } from "@apollo/client";

const REMOVE_CONTAINER = gql`
  mutation RemoveContainer($containerId: String!) {
    removeContainer(containerId: $containerId) {
      success
      message
    }
  }
`;

export default REMOVE_CONTAINER;

