import gql from "graphql-tag";

export default gql`
  query GetHostsInformation($id: ID!) {
    getHostsByProjectID(id: $id) {
      id
      domain_ids
      domains {
        id
        name
      }
      ip_address
      mac_address
      classification
      os {
        name
        method
      }
      servicesConnection {
        totalCount
      }
      vulnerabilitiesConnection {
        totalCount
      }
    }
  }
`;
