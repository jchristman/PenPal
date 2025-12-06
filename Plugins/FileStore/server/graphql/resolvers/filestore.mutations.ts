import PenPal from "#penpal/core";

// Import the shared logger from plugin.js
import { FileStoreLogger as logger } from "../../plugin.js";

export default {
  createBucket: async (parent, { name }, context) => {
    try {
      await PenPal.FileStore.CreateBucket(name);
      return true;
    } catch (error) {
      logger.error("Error creating bucket:", error);
      throw new Error("Failed to create bucket");
    }
  },

  deleteBucket: async (parent, { name }, context) => {
    try {
      await PenPal.FileStore.DeleteBucket(name);
      return true;
    } catch (error) {
      logger.error("Error deleting bucket:", error);
      throw new Error("Failed to delete bucket");
    }
  },

  deleteFile: async (parent, { bucket, fileName }, context) => {
    try {
      await PenPal.FileStore.DeleteFile(bucket, fileName);
      return true;
    } catch (error) {
      logger.error("Error deleting file:", error);
      throw new Error("Failed to delete file");
    }
  },

  uploadFile: async (
    parent,
    { bucket, fileName, file, metadata = {} },
    context
  ) => {
    try {
      // Get file data from GraphQL Upload scalar
      const { createReadStream, filename, mimetype, encoding } = await file;

      // Create buffer from stream for upload
      const stream = createReadStream();
      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const fileBuffer = Buffer.concat(chunks);

      // Prepare file metadata
      const fileMetadata = {
        ...metadata,
        contentType: mimetype,
        originalName: filename,
        encoding: encoding,
      };

      // Upload file through FileStore
      const result = await PenPal.FileStore.UploadFile(
        bucket,
        fileName,
        fileBuffer,
        fileMetadata
      );

      // Generate download URL for immediate access
      const downloadUrl = await PenPal.FileStore.GenerateDownloadUrl(
        bucket,
        fileName,
        { expirySeconds: 3600 }
      );

      return {
        success: true,
        fileId: result.id,
        downloadUrl: downloadUrl,
        error: null,
      };
    } catch (error) {
      logger.error("Error uploading file:", error);
      return {
        success: false,
        fileId: null,
        downloadUrl: null,
        error: error.message || "Failed to upload file",
      };
    }
  },
};
