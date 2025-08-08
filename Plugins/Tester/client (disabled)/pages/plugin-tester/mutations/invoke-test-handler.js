import { gql } from "@apollo/client";

const INVOKE_TEST_HANDLER = gql`
  mutation InvokeTestHandler($handler_id: ID!, $args: [JSON]) {
    invokeTestHandler(handler_id: $handler_id, args: $args) {
      success
      result
      error
      stack
      execution_time
      invoked_at
    }
  }
`;

export default INVOKE_TEST_HANDLER;
