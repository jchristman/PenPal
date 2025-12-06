import gql from "graphql-tag";
import { ProjectDetails } from "./project-details-fragment.ts";

export default gql`
  query getProjectDetails(
    $id: ID!
  ) {
    getProject(
      id: $id
    ) {
      ${ProjectDetails}
    }
  }
`;
