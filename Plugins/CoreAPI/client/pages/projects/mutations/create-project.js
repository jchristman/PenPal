import gql from "graphql-tag";
import { ProjectFields } from "../queries/project-summary-fragment.js";

export default gql`
  mutation createProjectMutation(
    $customer: ID!
    $name: String!
    $description: String!
    $start_date: Date
    $end_date: Date
    $project_ips: [IPAddress]
    $project_networks: [IPSubnet]
    $project_domains: [String]
    $profile: ID
  ) {
    createProject(
      project: {
        customer: $customer
        name: $name
        description: $description
        dates: { start: $start_date, end: $end_date }
        profile: $profile
        scope: { hosts: $project_ips, networks: $project_networks, domains: $project_domains }
      }
    ) {
      ${ProjectFields}
    }
  }
`;
