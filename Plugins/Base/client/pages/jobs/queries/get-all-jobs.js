import gql from "graphql-tag";

export default gql`
  {
    getPlugins {
      id
      name
      jobs {
        id
        name
        progress
        statusText
        stages {
          id
          name
          progress
          statusText
        }
      }
    }
  }
`;
