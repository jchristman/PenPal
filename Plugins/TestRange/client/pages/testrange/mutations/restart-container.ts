import { gql } from "@apollo/client";

const RESTART_CONTAINER = gql`
  mutation RestartContainer($containerId: String!) {
    restartContainer(containerId: $containerId) {
      success
      message
    }
  }
`;

export default RESTART_CONTAINER;

