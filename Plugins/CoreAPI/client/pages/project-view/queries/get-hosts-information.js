import gql from "graphql-tag";

export default gql`
  query GetHostsInformation($id: ID!) {
    getHostsByProjectID(id: $id) {
      id
      hostnames
      ip_address
      mac_address
      os {
        name
        method
      }
      servicesConnection {
        totalCount
      }
    }
  }
`;
