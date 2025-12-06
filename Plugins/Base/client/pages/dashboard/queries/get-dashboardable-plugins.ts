import { gql } from "@apollo/client";

export default gql`
  {
    getDashboardablePlugins {
      id
      name
      version
      settings {
        dashboard {
          schema_root
          getter
        }
      }
    }
  }
`;
