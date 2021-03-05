import coreAPIDeleteHostTrigger from "./core-api-delete-host.js";
import coreAPINewHostTrigger from "./core-api-new-host.js";
import coreAPIUpdateHostTrigger from "./core-api-update-host.js";
import coreAPIDeleteNetworkTrigger from "./core-api-delete-network.js";
import coreAPINewNetworkTrigger from "./core-api-new-network.js";
import coreAPIUpdateNetworkTrigger from "./core-api-update-network.js";

export default [
  coreAPIDeleteHostTrigger,
  coreAPINewHostTrigger,
  coreAPIUpdateHostTrigger,
  coreAPIDeleteNetworkTrigger,
  coreAPINewNetworkTrigger,
  coreAPIUpdateNetworkTrigger
];
