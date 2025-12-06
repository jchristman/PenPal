import { gql } from "@apollo/client";

const DEPLOY_VULHUB_CONTAINER = gql`
  mutation DeployVulhubContainer($containerPath: String!, $containerName: String!) {
    deployVulhubContainer(containerPath: $containerPath, containerName: $containerName) {
      success
      containers {
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
      portMappings
      message
    }
  }
`;

export default DEPLOY_VULHUB_CONTAINER;

