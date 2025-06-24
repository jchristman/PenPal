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
        plugin_name
        data
        ... on HttpXPluginEnrichment {
          url
          status_code
          content_type
          title
          tech
          method
          scheme
          path
        }
        ... on GowitnessPluginEnrichment {
          screenshot_url
          screenshot_bucket
          screenshot_key
          captured_at
          url
          title
          status_code
        }
        ... on NmapPluginEnrichment {
          service
          fingerprint
          product
          version
          extra_info
        }
      }
    }
  }
`;
