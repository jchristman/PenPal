import gql from "graphql-tag";

export const ProjectFields = `
    id
    name
    description
    customer {
      id
      name
    }
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
  fragment ProjectFields on Project {
    ${ProjectFields}
  }
`;
