import PenPal from "meteor/penpal";

const buildNode = () =>
  PenPal.N8n.NodeBuilder()
    .displayName("(PenPal) Delete Host Trigger")
    .name("CoreAPIDeleteHost")
    .icon("fa:desktop")
    .description(
      "Webhook that will get called when a host is deleted in PenPal"
    )
    .trigger((trigger) =>
      trigger.name("CoreAPI.delete.host").type("host").trigger("delete")
    )
    .value();

export default buildNode;
