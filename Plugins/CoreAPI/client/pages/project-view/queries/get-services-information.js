import gql from "graphql-tag";

export default gql`
  query GetServicesInformation($id: ID!) {
    getServices(projectID: $id) {
      id
      name
      host {
        id
        ip_address
        hostnames
      }
      network {
        id
        subnet
      }
      ... on NetworkService {
        ip_protocol
        port
        status
        ttl
      }
      enrichments {
        plugin_name
        data
      }
    }
  }
`;
