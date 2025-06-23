import PenPal from "#penpal/core";
import MQTT from "async-mqtt";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

class MQTTClient {
  client = null;
  subscriptions = {};

  constructor() {}

  async Initialize() {
    let retries = 0;
    while (retries < 3) {
      try {
        this.client = await MQTT.connectAsync("mqtt://penpal-mqtt");
      } catch (e) {
        console.error("MQTT: Failed to connect, trying again in 5 seconds");
        retries++;
        await PenPal.Utils.Sleep(5000);
      }
      if (this.client) {
        break;
      }
    }

    if (!this.client) {
      console.error("Giving up on MQTT: Failed to connect");
      throw new Error("MQTT: Failed to connect");
    }

    this.client.on("message", (topic, message) =>
      this.HandleMessage(topic, message)
    );
    return this;
  }

  async Subscribe(topic_name, cb = () => {}) {
    this.subscriptions[topic_name] = cb;
    await this.client.subscribe(topic_name);
  }

  async Publish(topic_name, data) {
    const serialized_data =
      typeof data === "object" ? JSON.stringify(data) : data;

    try {
      await this.client.publish(topic_name, serialized_data);
    } catch (e) {
      console.error("Publish", e.stack);
    }
  }

  async HandleMessage(topic, message) {
    let data = message.toString();
    try {
      // This will error if the data is not json, else it will assign the parsed object to the data variable
      let tmp = JSON.parse(data);
      data = tmp;
    } catch (e) {}

    // Safely execute plugin subscription callbacks with error isolation
    if (this.subscriptions[topic]) {
      try {
        await this.subscriptions[topic](data, topic);
      } catch (error) {
        console.error(
          `[MQTT] Plugin error handling message on topic "${topic}":`,
          error.message
        );
        console.error(`[MQTT] Stack trace:`, error.stack);
        console.error(`[MQTT] Message data:`, JSON.stringify(data, null, 2));
        console.error(`[MQTT] Continuing to process other messages...`);
        // Don't re-throw the error - isolate plugin failures from MQTT system
      }
    }
  }
}

const MetricsLog = (message, topic) => {
  console.log(`[.] ${topic}: ${message}`);
};

const MosquittoPlugin = {
  async loadPlugin() {
    PenPal.MQTT = {
      NewClient: async () => {
        const new_client = new MQTTClient();
        return await new_client.Initialize();
      },
    };

    await PenPal.Docker.Compose({
      name: "penpal-mosquitto",
      docker_compose_path: `${__dirname}mosquitto/docker-compose.mosquitto.yaml`,
    });

    const MetricsClient = await PenPal.MQTT.NewClient();
    await MetricsClient.Subscribe("$SYS/broker/clients/connected", MetricsLog);

    return {};
  },
};

export default MosquittoPlugin;
