import PenPal from "meteor/penpal";

const buildNode = () =>
  PenPal.N8n.NodeBuilder()
    .displayName("(PenPal) Delete Network Trigger")
    .name("CoreAPIDeleteNetwork")
    .icon("fa:network-wired")
    .description(
      "Webhook that will get called when a network is deleted in PenPal"
    )
    .trigger((trigger) =>
      trigger.name("CoreAPI.delete.network").type("network").trigger("delete")
    )
    .value();

export default buildNode;
