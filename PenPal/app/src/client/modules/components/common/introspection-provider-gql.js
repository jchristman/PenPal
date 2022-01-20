import gql from "graphql-tag";

export default gql`
  {
    __schema {
      types {
        name
        description
        enumValues {
          name
          description
        }
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
      queryType {
        name
        fields {
          name
          description
        }
      }
      mutationType {
        name
        fields {
          name
          description
          type {
            name
            description
          }
          args {
            name
            type {
              name
              description
              kind
            }
          }
        }
      }
    }
  }
`;
