import PenPal from "#penpal/core";
import MinIOAdapter from "./adapter.js";
import { loadGraphQLFiles, resolvers } from "./graphql/index.js";
import * as url from "url";

// File-level logger that can be imported by other files
export const FileStoreMinIOAdapterLogger = PenPal.Utils.BuildLogger(
  "FileStoreMinIOAdapter"
);

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const settings = {
  configuration: {
    schema_root: "MinIOFileStoreConfiguration",
    getter: "getMinIOFileStoreConfiguration",
    setter: "setMinIOFileStoreConfiguration",
  },
};

// We have to hold the configuration for MinIO connection string in memory or on-disk,
// on disk not yet implemented so it needs to be tracked live
export const CONFIGURATION = {
  General: {
    endPoint: "penpal-minio",
    port: 9000,
    accessKey: "penpal",
    secretKey: "penpalpassword",
    useSSL: false,
  },
};

const MinIOFileStorePlugin = {
  async loadPlugin() {
    // Start Docker Compose
    await PenPal.Docker.Compose({
      name: "filestore-minio-adapter",
      docker_compose_path: `${__dirname}/docker-compose.filestore-minio-adapter.yaml`,
    });

    // Connect to MinIO (this now includes retry logic and waits for readiness)
    await MinIOAdapter.connect();

    // Register the adapter with FileStore
    PenPal.FileStore.RegisterAdapter("MinIOAdapter", MinIOAdapter);

    // Wait for the adapter to be ready before marking FileStore as ready
    const maxWait = 30000; // 30 seconds max wait
    const startTime = Date.now();

    while (
      !(await MinIOAdapter.isReady()) &&
      Date.now() - startTime < maxWait
    ) {
      FileStoreMinIOAdapterLogger.info(
        "Waiting for MinIO adapter to be fully ready..."
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (await MinIOAdapter.isReady()) {
      // Mark adapters as ready only after confirmed readiness
      PenPal.FileStore.SetAdaptersReady(true);
      FileStoreMinIOAdapterLogger.info(
        "MinIO adapter is ready and FileStore marked as ready"
      );
    } else {
      FileStoreMinIOAdapterLogger.error(
        "MinIO adapter failed to become ready within timeout"
      );
      throw new Error("MinIO adapter readiness timeout");
    }

    const types = await loadGraphQLFiles();

    return {
      graphql: {
        types,
        resolvers,
      },
      settings,
    };
  },
};

export default MinIOFileStorePlugin;
