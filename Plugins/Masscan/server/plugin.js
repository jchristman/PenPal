import PenPal from "#penpal/core";
import { start } from "repl";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import fs from "fs";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const settings = {
  docker: {
    name: "masscan",
    dockerfile: fs.readFileSync(`${__dirname}/Dockerfile`, {
      encoding: "utf8",
      flag: "r",
    }),
  },
};

const default_scan = {
  tcp_ports: [22, 445],
  udp_ports: [],
  scanRate: 1000,
  ping: false,
};

const start_scan = (host_info) => {
  console.log("Starting scan", host_info);
  resolvers[0].Mutation.performMasscan(null, {
    data: { ips: host_info.host_ids, ...default_scan },
  });
};

const MasscanPlugin = {
  async loadPlugin() {
    const types = await loadGraphQLFiles();

    const MQTT = await PenPal.MQTT.NewClient();
    await MQTT.Subscribe(PenPal.API.MQTT.Topics.New.Hosts, start_scan);

    return {
      graphql: {
        types,
        resolvers,
      },
      settings,
    };
  },
};

export default MasscanPlugin;
