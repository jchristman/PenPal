import IntrospectionQuery from "../../client/modules/components/common/introspection-provider-gql.js";

export default [
  {
    request: {
      query: IntrospectionQuery
    },
    result: {
      data: {
        __schema: {
          types: [
            {
              kind: "ENUM",
              name: "Industry",
              description: null,
              fields: null,
              enumValues: [
                {
                  name: "Test Industry 1",
                  description: null,
                  __typename: "enumValue"
                },
                {
                  name: "Test Industry 2",
                  description: null,
                  __typename: "enumValue"
                }
              ],
              __typename: "Industry"
            }
          ],
          queryType: null,
          mutationType: null,
          __typename: "__Schema"
        }
      }
    }
  }
];
