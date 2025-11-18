import gql from "graphql-tag";

export default gql`
  query GetDomainsByProject($projectId: ID!) {
    getDomainsByProject(projectId: $projectId) {
      domains {
        id
        name
        resolved_ips
      }
    }
  }
`;
