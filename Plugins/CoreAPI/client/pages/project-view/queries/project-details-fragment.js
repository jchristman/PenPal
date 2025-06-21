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
      hostsConnection {
        servicesConnection {
          totalCount
        }
        totalCount
      }
      networksConnection {
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
