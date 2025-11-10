import { gql } from "@apollo/client";

const GET_RUNNING_CONTAINERS = gql`
  query GetRunningContainers {
    getRunningContainers {
      id
      fullId
      name
      status
      image
      ipAddress
      network
      portMappings {
        hostPort
        containerPort
        protocol
      }
    }
  }
`;

export default GET_RUNNING_CONTAINERS;

