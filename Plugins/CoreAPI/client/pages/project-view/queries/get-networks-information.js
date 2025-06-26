import gql from "graphql-tag";

export default gql`
  query GetNetworksInformation($id: ID!) {
    getProject(id: $id) {
      scope {
        networksConnection {
          networks {
            id
            subnet
            domain
            hostsConnection {
              totalCount
              hosts {
                id
                servicesConnection {
                  totalCount
                }
              }
            }
          }
        }
      }
    }
  }
`;
