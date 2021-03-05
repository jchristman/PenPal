import analytics_default_resolvers from "./analytics.default.js";
import analytics_query_resolvers from "./analytics.queries.js";
import annotatable_default_resolvers from "./annotatable.default.js";
import auditable_default_resolvers from "./auditable.default.js";
import audit_user_default_resolvers from "./audit-user.default.js";
import configuration_mutation_resolvers from "./configuration.mutations.js";
import configuration_query_resolvers from "./configuration.queries.js";
import customer_default_resolvers from "./customer.default.js";
import customer_mutation_resolvers from "./customer.mutations.js";
import customer_query_resolvers from "./customer.queries.js";
import host_default_resolvers from "./host.default";
import host_mutation_resolvers from "./host.mutations.js";
import network_default_resolvers from "./network.default.js";
import project_default_resolvers from "./project.default.js";
import project_mutation_resolvers from "./project.mutations.js";
import project_query_resolvers from "./project.queries.js";
import service_default_resolvers from "./service.default.js";
import network_service_default_resolvers from "./service-network.default.js";
import scalar_resolvers from "./scalars.js";

export default {
  queries: {
    ...analytics_query_resolvers,
    ...configuration_query_resolvers,
    ...customer_query_resolvers,
    ...project_query_resolvers
  },
  mutations: {
    ...customer_mutation_resolvers,
    ...configuration_mutation_resolvers,
    ...host_mutation_resolvers,
    ...project_mutation_resolvers
  },
  default_resolvers: [
    analytics_default_resolvers,
    annotatable_default_resolvers,
    auditable_default_resolvers,
    audit_user_default_resolvers,
    customer_default_resolvers,
    host_default_resolvers,
    network_default_resolvers,
    network_service_default_resolvers,
    project_default_resolvers,
    service_default_resolvers
  ],
  scalars: scalar_resolvers
};
