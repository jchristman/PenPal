import { gql } from "@apollo/client";

const GET_TEST_HANDLERS = gql`
  query GetTestHandlers {
    getTestHandlers {
      id
      plugin_name
      handler_name
      args_schema {
        name
        type
        required
        description
      }
      registered_at
    }
  }
`;

export default GET_TEST_HANDLERS;
