import hosts from "./mock-hosts.json" with { type: "json" };
import networks from "./mock-networks.json" with { type: "json" };

export default {
  mockHosts: () => hosts.hosts,
  mockNetworks: () => networks.networks,
};
