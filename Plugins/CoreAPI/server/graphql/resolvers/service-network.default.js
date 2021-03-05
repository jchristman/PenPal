import { CachingDefaultResolvers } from "./common.js";

export default {
  NetworkService: {
    ...CachingDefaultResolvers("Services", [
      "id",
      "network",
      "project",
      "host",
      "name",
      "ip_protocol",
      "port",
      "status",
      "ttl"
    ])
  }
};
