import { gql } from "@apollo/client";

const GET_RECENT_CONTAINERS = gql`
  query GetRecentContainers($limit: Int) {
    getRecentContainers(limit: $limit) {
      id
      containerId
      containerName
      image
      vulhubPath
      deployedAt
      portMappings {
        hostPort
        containerPort
        protocol
      }
      created_at
      updated_at
    }
  }
`;

export default GET_RECENT_CONTAINERS;

