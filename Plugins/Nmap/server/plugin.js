import PenPal from "#penpal/core";

PenPal.Test = {};

const settings = {
  docker: {
    name: "penpal:nmap",
    image: "instrumentisto/nmap",
  },
};

const start_services_scan = (services) => {
  console.log("New Services!", services);
};

const NmapPlugin = {
  async loadPlugin() {
    const MQTT = await PenPal.MQTT.NewClient();
    await MQTT.Subscribe(
      PenPal.API.MQTT.Topics.New.Services,
      start_services_scan
    );

    return {
      settings,
    };
  },
};

export default NmapPlugin;
