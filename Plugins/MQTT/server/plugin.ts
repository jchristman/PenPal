import PenPal from "#penpal/core";
import type { PenPalPlugin, PluginLoadResult } from "#penpal/common";
import MQTT from "async-mqtt";
import * as url from "url";
import mqtt from "mqtt";

// Initialize logger for this plugin
const logger = PenPal.Utils.BuildLogger("MQTT");

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

interface MQTTSubscriptionCallback {
  (data: any, topic: string): Promise<void>;
}

interface MQTTClientInstance {
  client: MQTT.AsyncClient | null;
  subscriptions: Record<string, MQTTSubscriptionCallback>;
  Initialize(): Promise<MQTTClientInstance>;
  Subscribe(topic_name: string, cb?: MQTTSubscriptionCallback): Promise<void>;
  Publish(topic_name: string, data: any): Promise<void>;
  HandleMessage(topic: string, message: Buffer): Promise<void>;
}

class MQTTClient implements MQTTClientInstance {
  client: MQTT.AsyncClient | null = null;
  subscriptions: Record<string, MQTTSubscriptionCallback> = {};

  constructor() {}

  async Initialize(): Promise<MQTTClientInstance> {
    let retries = 0;
    while (retries < 3) {
      try {
        this.client = await MQTT.connectAsync("mqtt://penpal-mqtt");
      } catch (e) {
        logger.error("MQTT: Failed to connect, trying again in 5 seconds");
        retries++;
        await PenPal.Utils.Sleep(5000);
      }
      if (this.client) {
        break;
      }
    }

    if (!this.client) {
      logger.error("Giving up on MQTT: Failed to connect");
      throw new Error("MQTT: Failed to connect");
    }

    this.client.on("message", (topic, message) =>
      this.HandleMessage(topic, message)
    );
    return this;
  }

  async Subscribe(topic_name: string, cb: MQTTSubscriptionCallback = async () => {}): Promise<void> {
    this.subscriptions[topic_name] = cb;
    // mqtt.js expects an options object; passing none can lead to undefined options/resubscribe errors
    await this.client!.subscribe(topic_name, {});
  }

  async Publish(topic_name: string, data: any): Promise<void> {
    const serialized_data =
      typeof data === "object" ? JSON.stringify(data) : data;

    try {
      await this.client!.publish(topic_name, serialized_data);
    } catch (e: any) {
      logger.error("Publish", e.stack);
    }
  }

  async HandleMessage(topic: string, message: Buffer): Promise<void> {
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
        logger.error(
          `Plugin error handling message on topic "${topic}":`,
          error.message
        );
        logger.error(`Stack trace:`, error.stack);
        logger.error(`Message data:`, JSON.stringify(data, null, 2));
        logger.error(`Continuing to process other messages...`);
        // Don't re-throw the error - isolate plugin failures from MQTT system
      }
    }
  }
}

const MetricsLog = (message: string, topic: string): void => {
  logger.info(`${topic}: ${message}`);
};

const MosquittoPlugin: PenPalPlugin = {
  async loadPlugin(): Promise<PluginLoadResult> {
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
