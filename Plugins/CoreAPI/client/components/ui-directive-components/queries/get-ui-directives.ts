import { gql } from "@apollo/client";

const GET_UI_DIRECTIVES = gql`
  query GetUIDirectives($typeName: String!) {
    getUIDirectives(typeName: $typeName)
  }
`;

export default GET_UI_DIRECTIVES;
