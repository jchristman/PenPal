import { gql } from "@apollo/client";

const STOP_CONTAINER = gql`
  mutation StopContainer($containerId: String!) {
    stopContainer(containerId: $containerId) {
      success
      message
    }
  }
`;

export default STOP_CONTAINER;

