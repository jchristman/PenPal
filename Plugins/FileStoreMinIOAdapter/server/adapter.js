import * as Minio from "minio";
import { Readable } from "stream";
import PenPal from "#penpal/core";

// Import the shared logger from plugin.js
import { FileStoreMinIOAdapterLogger as logger } from "./plugin.js";

const MinIOAdapter = {};
MinIOAdapter.client = null;
MinIOAdapter.connected = false;

MinIOAdapter.connect = async () => {
  logger.info("Connecting to MinIO server");

  MinIOAdapter.client = new Minio.Client({
    endPoint: "penpal-minio",
    port: 9000,
    useSSL: false,
    accessKey: "penpal",
    secretKey: "penpalpassword",
  });

  logger.info("MinIO client created, testing connection...");

  // Test the connection with retry logic
  await MinIOAdapter.waitForConnection();

  MinIOAdapter.connected = true;
  logger.info("Connected to MinIO and verified");
};

// Wait for MinIO to be ready with exponential backoff
MinIOAdapter.waitForConnection = async (maxRetries = 10, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Test connection by listing buckets
      await MinIOAdapter.client.listBuckets();
      // console.log(`MinIO connection verified on attempt ${attempt}`);
      return;
    } catch (error) {
      const delay = baseDelay * Math.pow(1.5, attempt - 1); // Exponential backoff
      // console.log(
      //   `MinIO not ready (attempt ${attempt}/${maxRetries}): ${error.message}`
      // );

      if (attempt === maxRetries) {
        logger.error(
          `Failed to connect to MinIO after ${maxRetries} attempts`
        );
        throw new Error(
          `MinIO connection failed after ${maxRetries} attempts: ${error.message}`
        );
      }

      // console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Check if adapter is ready
MinIOAdapter.isReady = async () => {
  try {
    if (!MinIOAdapter.client || !MinIOAdapter.connected) {
      return false;
    }

    // Test connection by listing buckets
    await MinIOAdapter.client.listBuckets();
    return true;
  } catch (error) {
    logger.error("MinIO not ready:", error.message);
    MinIOAdapter.connected = false;
    return false;
  }
};

// -----------------------------------------------------------------------
// MinIOAdapter bucket operations

MinIOAdapter.CreateBucket = async (bucket_name, options = {}) => {
  try {
    const exists = await MinIOAdapter.client.bucketExists(bucket_name);
    if (!exists) {
      await MinIOAdapter.client.makeBucket(
        bucket_name,
        options.region || "us-east-1"
      );
      logger.info(`Created bucket: ${bucket_name}`);
      return { name: bucket_name, createdAt: new Date().toISOString() };
    } else {
      logger.info(`Bucket already exists: ${bucket_name}`);
      return { name: bucket_name, createdAt: null };
    }
  } catch (error) {
    logger.error(`Error creating bucket ${bucket_name}:`, error);
    throw error;
  }
};

MinIOAdapter.DeleteBucket = async (bucket_name) => {
  try {
    await MinIOAdapter.client.removeBucket(bucket_name);
    logger.info(`Deleted bucket: ${bucket_name}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting bucket ${bucket_name}:`, error);
    throw error;
  }
};

MinIOAdapter.ListBuckets = async () => {
  try {
    const buckets = await MinIOAdapter.client.listBuckets();
    return buckets.map((bucket) => ({
      name: bucket.name,
      createdAt: bucket.creationDate.toISOString(),
      fileCount: 0, // MinIO doesn't provide this efficiently, could be computed separately
    }));
  } catch (error) {
    logger.error("Error listing buckets:", error);
    throw error;
  }
};

// -----------------------------------------------------------------------
// MinIOAdapter file operations

MinIOAdapter.UploadFile = async (
  bucket_name,
  file_name,
  file_data,
  file_info
) => {
  try {
    let stream;
    let size;

    if (Buffer.isBuffer(file_data)) {
      // Convert Buffer to stream
      stream = Readable.from(file_data);
      size = file_data.length;
    } else if (file_data.readable) {
      // Already a stream
      stream = file_data;
      size = file_info.size;
    } else {
      throw new Error("Invalid file data format");
    }

    // Prepare metadata for MinIO
    const metadata = {
      "Content-Type": file_info.contentType || "application/octet-stream",
      "X-File-ID": file_info.id,
      "X-Upload-Date": file_info.uploadedAt,
      ...Object.entries(file_info.metadata || {}).reduce(
        (acc, [key, value]) => {
          acc[`X-Custom-${key}`] = String(value);
          return acc;
        },
        {}
      ),
    };

    const uploadInfo = await MinIOAdapter.client.putObject(
      bucket_name,
      file_name,
      stream,
      size,
      metadata
    );

    return {
      ...file_info,
      etag: uploadInfo.etag,
      size: size,
    };
  } catch (error) {
    logger.error(`Error uploading file ${file_name}:`, error);
    throw error;
  }
};

MinIOAdapter.DownloadFile = async (bucket_name, file_name) => {
  try {
    const stream = await MinIOAdapter.client.getObject(bucket_name, file_name);

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    logger.error(`Error downloading file ${file_name}:`, error);
    throw error;
  }
};

MinIOAdapter.DeleteFile = async (bucket_name, file_name) => {
  try {
    await MinIOAdapter.client.removeObject(bucket_name, file_name);
    logger.info(`Deleted file: ${bucket_name}/${file_name}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting file ${file_name}:`, error);
    throw error;
  }
};

MinIOAdapter.GetFileInfo = async (bucket_name, file_name) => {
  try {
    const stat = await MinIOAdapter.client.statObject(bucket_name, file_name);

    // Extract custom metadata
    const customMetadata = {};
    Object.entries(stat.metaData || {}).forEach(([key, value]) => {
      if (key.startsWith("x-custom-")) {
        const customKey = key.replace("x-custom-", "");
        customMetadata[customKey] = value;
      }
    });

    return {
      id: stat.metaData?.["x-file-id"] || null,
      bucket: bucket_name,
      name: file_name,
      size: stat.size,
      contentType:
        stat.metaData?.["content-type"] || "application/octet-stream",
      lastModified: stat.lastModified.toISOString(),
      uploadedAt:
        stat.metaData?.["x-upload-date"] || stat.lastModified.toISOString(),
      metadata: customMetadata,
      etag: stat.etag,
    };
  } catch (error) {
    logger.error(`Error getting file info ${file_name}:`, error);
    throw error;
  }
};

MinIOAdapter.ListFiles = async (bucket_name, options = {}) => {
  try {
    const { limit = 50, offset = 0, prefix = "" } = options;

    const objectsStream = MinIOAdapter.client.listObjectsV2(
      bucket_name,
      prefix,
      false
    );
    const files = [];

    let count = 0;
    let skipped = 0;

    for await (const obj of objectsStream) {
      if (skipped < offset) {
        skipped++;
        continue;
      }

      if (count >= limit) {
        break;
      }

      // Get detailed file info for each object
      try {
        const fileInfo = await MinIOAdapter.GetFileInfo(bucket_name, obj.name);
        files.push(fileInfo);
        count++;
      } catch (error) {
        logger.warn(`Could not get info for ${obj.name}:`, error.message);
      }
    }

    return files;
  } catch (error) {
    logger.error(`Error listing files in bucket ${bucket_name}:`, error);
    throw error;
  }
};

// -----------------------------------------------------------------------
// MinIOAdapter streaming operations

MinIOAdapter.GetUploadStream = async (bucket_name, file_name, file_info) => {
  try {
    // For MinIO, we'll return a function that accepts a stream
    return {
      uploadStream: async (inputStream, size) => {
        const metadata = {
          "Content-Type": file_info.contentType || "application/octet-stream",
          "X-File-ID": file_info.id,
          "X-Upload-Date": file_info.uploadedAt,
        };

        const uploadInfo = await MinIOAdapter.client.putObject(
          bucket_name,
          file_name,
          inputStream,
          size,
          metadata
        );

        return {
          ...file_info,
          etag: uploadInfo.etag,
          size: size,
        };
      },
    };
  } catch (error) {
    logger.error(`Error creating upload stream for ${file_name}:`, error);
    throw error;
  }
};

MinIOAdapter.GetDownloadStream = async (bucket_name, file_name) => {
  try {
    return await MinIOAdapter.client.getObject(bucket_name, file_name);
  } catch (error) {
    logger.error(`Error creating download stream for ${file_name}:`, error);
    throw error;
  }
};

// -----------------------------------------------------------------------
// MinIOAdapter URL generation

MinIOAdapter.GenerateUploadUrl = async (
  bucket_name,
  file_name,
  options = {}
) => {
  try {
    const { expirySeconds = 3600 } = options;

    return await MinIOAdapter.client.presignedPutObject(
      bucket_name,
      file_name,
      expirySeconds
    );
  } catch (error) {
    logger.error(`Error generating upload URL for ${file_name}:`, error);
    throw error;
  }
};

MinIOAdapter.GenerateDownloadUrl = async (
  bucket_name,
  file_name,
  options = {}
) => {
  try {
    const { expirySeconds = 3600 } = options;

    return await MinIOAdapter.client.presignedGetObject(
      bucket_name,
      file_name,
      expirySeconds
    );
  } catch (error) {
    logger.error(`Error generating download URL for ${file_name}:`, error);
    throw error;
  }
};

export default MinIOAdapter;
