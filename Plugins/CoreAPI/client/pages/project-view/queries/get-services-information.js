import gql from "graphql-tag";

export default gql`
  query GetServicesInformation($id: ID!) {
    getServices(projectID: $id) {
      id
      name
      host {
        id
        ip_address
        domain_ids
        domains {
          id
          name
        }
      }
      network {
        id
        subnet
      }
      ... on NetworkService {
        ip_protocol
        port
        status
        ttl
      }
      enrichments {
        __typename
        plugin_name
        data
        files {
          id
          filename
          stored_filename
          bucket_name
          file_type
          category
          size
          mime_type
          uploaded_at
          metadata
        }
      }
      vulnerabilitiesConnection {
        totalCount
      }
    }
  }
`;
