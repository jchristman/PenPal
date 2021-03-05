import GetCustomersQuery from "../../client/pages/customers/queries/get-customers.js";

export default [
  {
    request: {
      query: GetCustomersQuery
    },
    result: {
      data: {
        getCustomers: [
          {
            id: "mock-customer-id",
            name: "Mock Customer 1",
            industry: "Agriculture"
          }
        ]
      }
    }
  }
];
