import PenPal from "#penpal/core";

export default {
  async attachFileToEnrichment(
    parent,
    { service_selector, plugin_name, file_data, metadata },
    context
  ) {
    try {
      // Handle file upload from GraphQL Upload scalar
      const { createReadStream, filename, mimetype } = await file_data;

      // Read the file stream into a buffer
      const stream = createReadStream();
      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Prepare file data for the API
      const file_data_obj = {
        filename,
        buffer,
        mimeType: mimetype,
      };

      // Call the API function
      const result = await PenPal.API.Services.AttachFileToEnrichment(
        service_selector,
        plugin_name,
        file_data_obj,
        metadata || {}
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  async removeFileFromEnrichment(parent, { file_id }, context) {
    try {
      const result = await PenPal.API.Services.RemoveFileFromEnrichment(
        file_id
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
