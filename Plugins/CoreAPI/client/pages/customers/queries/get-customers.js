import gql from "graphql-tag";

export default gql`
  query getCustomersQuery {
    getCustomers {
      id
      name
      industry
    }
  }
`;
