import gql from "graphql-tag";
import { ProjectFields } from "./project-summary-fragment.js";

export default gql`
  query getProjectSummaries(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $pageSize: Int
    $pageNumber: Int
    $searchTerm: String
    $sortBy: String
    $sortDirection: String
  ) {
    getProjects(
      first: $first
      after: $after
      last: $last
      before: $before
      pageSize: $pageSize
      pageNumber: $pageNumber
      searchTerm: $searchTerm
      sortBy: $sortBy
      sortDirection: $sortDirection
    ) {
      projects {
        ${ProjectFields}
      }
      totalCount
    }
  }
`;
