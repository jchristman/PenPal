import PenPal from "meteor/penpal";

const buildNode = () =>
  PenPal.N8n.NodeBuilder()
    .displayName("(PenPal) New Network Trigger")
    .name("CoreAPINewNetwork")
    .icon("fa:network-wired")
    .description(
      "Webhook that will get called when a new network is added in PenPal"
    )
    .trigger((trigger) =>
      trigger.name("CoreAPI.new.network").type("network").trigger("new")
    )
    .value();

export default buildNode;
