import gql from "graphql-tag";

export default gql`
  mutation createNewCustomerMutation($name: String!, $industry: Industry!) {
    createCustomer(customer: { name: $name, industry: $industry }) {
      id
      name
      industry
    }
  }
`;
