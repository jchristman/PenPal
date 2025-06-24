import minio_config_resolvers from "./minio-config.js";

export default {
  queries: {
    ...minio_config_resolvers.queries,
  },
  mutations: {
    ...minio_config_resolvers.mutations,
  },
};
