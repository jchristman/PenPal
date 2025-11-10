import { gql } from "@apollo/client";

const GET_AVAILABLE_CONTAINERS = gql`
  query GetAvailableContainers {
    getAvailableContainers {
      id
      category
      name
      path
      relativePath
      dockerComposePath
    }
  }
`;

export default GET_AVAILABLE_CONTAINERS;

