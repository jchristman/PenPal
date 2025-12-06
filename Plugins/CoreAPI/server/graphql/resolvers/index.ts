import analytics_default_resolvers from "./analytics.default.ts";
import analytics_query_resolvers from "./analytics.queries.ts";
import annotatable_default_resolvers from "./annotatable.default.ts";
import auditable_default_resolvers from "./auditable.default.ts";
import audit_user_default_resolvers from "./audit-user.default.ts";
import configuration_mutation_resolvers from "./configuration.mutations.ts";
import configuration_query_resolvers from "./configuration.queries.ts";
import customer_default_resolvers from "./customer.default.ts";
import customer_mutation_resolvers from "./customer.mutations.ts";
import customer_query_resolvers from "./customer.queries.ts";
import domain_default_resolvers from "./domain.default.ts";
import domain_mutation_resolvers from "./domain.mutations.ts";
import domain_query_resolvers from "./domain.queries.ts";
import enrichable_default_resolvers from "./enrichable.default.ts";
import file_attachments_query_resolvers from "./file-attachments.queries.ts";
import file_attachments_mutation_resolvers from "./file-attachments.mutations.ts";
import host_default_resolvers from "./host.default.ts";
import host_query_resolvers from "./host.queries.ts";
import host_mutation_resolvers from "./host.mutations.ts";
import network_default_resolvers from "./network.default.ts";
import network_mutation_resolvers from "./network.mutations.ts";
import project_default_resolvers from "./project.default.ts";
import project_mutation_resolvers from "./project.mutations.ts";
import project_query_resolvers from "./project.queries.ts";
import service_default_resolvers from "./service.default.ts";
import service_query_resolvers from "./service.queries.ts";
import network_service_default_resolvers from "./service-network.default.ts";
import scalar_resolvers from "./scalars.ts";
import vulnerability_default_resolvers from "./vulnerability.default.ts";
import vulnerability_query_resolvers from "./vulnerability.queries.ts";
import vulnerability_mutation_resolvers from "./vulnerability.mutations.ts";
import ui_directives_default_resolvers from "./ui-directives.default.ts";
import ui_directive_query_resolvers from "./ui-directives.queries.ts";

export default {
  queries: {
    ...analytics_query_resolvers,
    ...configuration_query_resolvers,
    ...customer_query_resolvers,
    ...domain_query_resolvers,
    ...file_attachments_query_resolvers,
    ...host_query_resolvers,
    ...project_query_resolvers,
    ...service_query_resolvers,
    ...ui_directive_query_resolvers,
    ...vulnerability_query_resolvers,
  },
  mutations: {
    ...customer_mutation_resolvers,
    ...configuration_mutation_resolvers,
    ...domain_mutation_resolvers,
    ...file_attachments_mutation_resolvers,
    ...host_mutation_resolvers,
    ...network_mutation_resolvers,
    ...project_mutation_resolvers,
    ...vulnerability_mutation_resolvers,
  },
  default_resolvers: [
    analytics_default_resolvers,
    annotatable_default_resolvers,
    auditable_default_resolvers,
    audit_user_default_resolvers,
    customer_default_resolvers,
    domain_default_resolvers,
    enrichable_default_resolvers,
    host_default_resolvers,
    network_default_resolvers,
    network_service_default_resolvers,
    project_default_resolvers,
    service_default_resolvers,
    ui_directives_default_resolvers,
    vulnerability_default_resolvers,
  ],
  scalars: scalar_resolvers,
};
