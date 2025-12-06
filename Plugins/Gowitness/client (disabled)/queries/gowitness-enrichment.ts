import { gql } from "@apollo/client";

export const GOWITNESS_ENRICHMENT_FRAGMENT = gql`
  fragment GowitnessEnrichmentData on GowitnessPluginEnrichment {
    plugin_name
    screenshot_url
    screenshot_bucket
    screenshot_key
    captured_at
    url
    title
    status_code
  }
`;

export default GOWITNESS_ENRICHMENT_FRAGMENT;
