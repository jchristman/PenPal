import gql from "graphql-tag";

export const ProjectDetails = `
    id
    name
    customer {
      id
      name
    }
    description
    dates {
      created_at
      start
      end
    }
    scope {
      hostsConnection(first:5) {
        hosts {
          id
          ip_address
          mac_address
        }
        servicesConnection {
          totalCount
        }
        totalCount
      }
      networksConnection(first:5) {
        networks {
          id
          subnet
          hostsConnection(first:5) {
          	hosts {
              id
              ip_address
              mac_address
            }
            servicesConnection {
              totalCount
            }
            totalCount
          }
        }
        hostsConnection {
          servicesConnection {
            totalCount
          }
          totalCount
        }
        totalCount
      }
    }
`;

export default gql`
  fragment ProjectDetails on Project {
    ${ProjectDetails}
  }
`;
