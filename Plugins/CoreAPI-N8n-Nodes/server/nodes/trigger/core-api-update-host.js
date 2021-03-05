import PenPal from "meteor/penpal";

const buildNode = () =>
  PenPal.N8n.NodeBuilder()
    .displayName("(PenPal) Update Host Trigger")
    .name("CoreAPIUpdateHost")
    .icon("fa:desktop")
    .description(
      "Webhook that will get called when a host is updated in PenPal"
    )
    .trigger((trigger) =>
      trigger.name("CoreAPI.update.host").type("host").trigger("update")
    )
    .value();

export default buildNode;
