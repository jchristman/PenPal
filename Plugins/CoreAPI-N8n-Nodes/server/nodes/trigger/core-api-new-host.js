import PenPal from "meteor/penpal";

const buildNode = () =>
  PenPal.N8n.NodeBuilder()
    .displayName("(PenPal) New Host Trigger")
    .name("CoreAPINewHost")
    .icon("fa:desktop")
    .description(
      "Webhook that will get called when a new host is added in PenPal"
    )
    .trigger((trigger) =>
      trigger.name("CoreAPI.new.host").type("host").trigger("new")
    )
    .value();

export default buildNode;
