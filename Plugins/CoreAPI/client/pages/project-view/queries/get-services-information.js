import gql from "graphql-tag";

export default gql`
  query GetServicesInformation($id: ID!) {
    getServices(projectID: $id) {
      id
      name
      host {
        id
        ip_address
        hostnames
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
        ... on HttpXPluginEnrichment {
          url
          status_code
          content_type
          content_length
          title
          server
          tech
          method
          scheme
          path
        }
        ... on GowitnessPluginEnrichment {
          url
          status_code
          title
          screenshot_url
          screenshot_bucket
          screenshot_key
          captured_at
        }
        ... on NmapPluginEnrichment {
          service
          product
          version
          fingerprint
          extra_info
        }
      }
      vulnerabilitiesConnection {
        totalCount
      }
    }
  }
`;
