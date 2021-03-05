import PenPal from "meteor/penpal";
import mutations from "../../graphql/resolvers/mutations.js";

const tcp_ports = [21, 22, 23, 25, 80, 135, 139, 443, 445, 3389, 8080];
const udp_ports = [53, 111, 137, 161];

const buildNode = () =>
  PenPal.N8n.NodeBuilder()
    .displayName("(Masscan) Host Discovery")
    .name("MasscanHostDiscovery")
    .icon("fa:shipping-fast")
    .description(
      `Perform a host discovery scan using the masscan tool utilizing ${
        tcp_ports.length + udp_ports.length
      } common ports and ICMP`
    )
    .addMutationHandler(mutations.performMasscan)
    .addVariable((variable) =>
      variable
        .displayName("Project ID")
        .name("project_id")
        .description("Project ID of the hosts to scan")
        .required()
    )
    .addVariable((variable) =>
      variable
        .displayName("IP Addresses")
        .name("ips")
        .description("A comma separated list of IP addresses to scan")
        .required()
    )
    .addVariable((variable) =>
      variable
        .displayName("TCP Ports")
        .name("tcp_ports")
        .default(tcp_ports.join(","))
        .description("A comma separated list of TCP ports to scan on each host")
        .required()
    )
    .addVariable((variable) =>
      variable
        .displayName("UDP Ports")
        .name("udp_ports")
        .default(udp_ports.join(","))
        .description("A comma separated list of UDP ports to scan on each host")
        .required()
    )
    .addVariable((variable) =>
      variable
        .displayName("Ping")
        .name("ping")
        .type("boolean")
        .default(true)
        .description("Whether or not to ping the hosts being scanned")
        .required()
    )
    .addVariable((variable) =>
      variable
        .displayName("Scan Rate")
        .name("scanRate")
        .type("number")
        .default(1000)
        .description("Rate of scan to perform in packers per second")
        .required()
    )
    .value();

export default buildNode;
