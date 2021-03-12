import gql from "graphql-tag";
import { ProjectDetails } from "./project-details-fragment.js";

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
