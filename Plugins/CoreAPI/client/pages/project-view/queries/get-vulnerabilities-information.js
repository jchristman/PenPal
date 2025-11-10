import gql from "graphql-tag";

export default gql`
  query GetVulnerabilitiesInformation($projectID: ID!) {
    getVulnerabilitiesByProjectID(projectID: $projectID) {
      id
      title
      description
      severity
      cveIds
      cvssScore
      discoveredBy
      discoveredAt
      status
      references
      metadata
      affectedHosts {
        id
        ip_address
        hostnames
      }
      affectedServices {
        id
        host {
          id
          ip_address
        }
        ... on NetworkService {
          port
          ip_protocol
        }
      }
      project {
        id
      }
    }
  }
`;

