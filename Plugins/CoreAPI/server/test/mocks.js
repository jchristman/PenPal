import hosts from "./mock-hosts.json" assert { type: "json" };
import networks from "./mock-networks.json" assert { type: "json" };

export default {
  mockHosts: () => hosts.hosts,
  mockNetworks: () => networks.networks,
};
