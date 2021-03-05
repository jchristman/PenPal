import PenPal from "meteor/penpal";
import queries from "../../graphql/resolvers/queries.js";

const buildNode = () =>
  PenPal.N8n.NodeBuilder()
    .displayName("(PenPal) Get Host Data")
    .name("CoreAPIGetHost")
    .icon("fa:desktop")
    .description("Retrieve information for hosts from the PenPal server")
    .addQueryHandler(queries.coreAPIGetHostData)
    .addVariable((variable) =>
      variable
        .displayName("Project ID")
        .name("project_id")
        .description(
          "The field that represents the project ID coming into this node"
        )
        .required()
    )
    .addVariable((variable) =>
      variable
        .displayName("Host IDs")
        .name("host_ids")
        .description("The field that represents the host IDs to get data for")
        .required()
    )
    .addField((field) =>
      field
        .displayName("IP Address")
        .name("ip_address")
        .type("boolean")
        .default(true)
        .description("Get IP Address")
    )
    .addField((field) =>
      field
        .displayName("MAC Address")
        .name("mac_address")
        .type("boolean")
        .default(false)
        .description("Get MAC Address")
    )
    .addField((field) =>
      field
        .displayName("Hostname(s)")
        .name("hostnames")
        .type("boolean")
        .default(false)
        .description("Get hostnames")
    )
    .value();

export default buildNode;
