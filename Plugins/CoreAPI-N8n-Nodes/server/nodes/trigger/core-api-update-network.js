import PenPal from "meteor/penpal";

const buildNode = () =>
  PenPal.N8n.NodeBuilder()
    .displayName("(PenPal) Update Network Trigger")
    .name("CoreAPIUpdateNetwork")
    .icon("fa:network-wired")
    .description(
      "Webhook that will get called when a network is updated in PenPal"
    )
    .trigger((trigger) =>
      trigger.name("CoreAPI.update.network").type("network").trigger("update")
    )
    .value();

export default buildNode;
