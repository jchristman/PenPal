import { CachingDefaultResolvers } from "./common.ts";

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
