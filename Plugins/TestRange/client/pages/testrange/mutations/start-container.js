import { gql } from "@apollo/client";

const START_CONTAINER = gql`
  mutation StartContainer($containerId: String!) {
    startContainer(containerId: $containerId) {
      success
      message
    }
  }
`;

export default START_CONTAINER;

