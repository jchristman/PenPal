import { mergeTypeDefs } from "@graphql-tools/merge";

import analytics_queries from "./analytics.queries.graphql";
import analytics_schema from "./analytics.schema.graphql";
import annotations_schema from "./annotations.schema.graphql";
import audit_schema from "./audit.schema.graphql";
import commone_schema from "./common.schema.graphql";
import configuration_mutations from "./configuration.mutations.graphql";
import configuration_queries from "./configuration.queries.graphql";
import configuration_schema from "./configuration.schema.graphql";
import customer_mutations from "./customer.mutations.graphql";
import customer_queries from "./customer.queries.graphql";
import customer_schema from "./customer.schema.graphql";
import host_mutations from "./host.mutations.graphql";
import host_queries from "./host.queries.graphql";
import host_schema from "./host.schema.graphql";
import network_schema from "./network.schema.graphql";
import project_mutations from "./project.mutations.graphql";
import project_queries from "./project.queries.graphql";
import project_schema from "./project.schema.graphql";
import service_queries from "./service.queries.graphql";
import service_schema from "./service.schema.graphql";

const types = [
  analytics_queries,
  analytics_schema,
  annotations_schema,
  audit_schema,
  commone_schema,
  configuration_mutations,
  configuration_queries,
  configuration_schema,
  customer_mutations,
  customer_queries,
  customer_schema,
  host_mutations,
  host_queries,
  host_schema,
  network_schema,
  project_mutations,
  project_queries,
  project_schema,
  service_queries,
  service_schema
];

export default mergeTypeDefs(types);
