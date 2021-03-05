import PenPal from "meteor/penpal";
import queries from "../../graphql/resolvers/queries.js";

const buildNode = () =>
  PenPal.N8n.NodeBuilder()
    .displayName("(PenPal) Get Network Data")
    .name("CoreAPIGetNetwork")
    .icon("fa:network-wired")
    .description("Retrieve information for networks from the PenPal server")
    .addQueryHandler(queries.coreAPIGetNetworkData)
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
        .displayName("Network IDs")
        .name("network_ids")
        .description(
          "The field that represents the network IDs to get data for"
        )
        .required()
    )
    .addField((field) =>
      field
        .displayName("Subnet")
        .name("subnet")
        .type("boolean")
        .default(true)
        .description("Get Subnet")
    )
    .addField((field) =>
      field
        .displayName("Domain")
        .name("domain")
        .type("boolean")
        .default(false)
        .description("Get Domain")
    )
    .value();

export default buildNode;
