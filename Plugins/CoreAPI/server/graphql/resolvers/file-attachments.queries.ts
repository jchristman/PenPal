import PenPal from "#penpal/core";

export default {
  async getEnrichmentFiles(parent, { service_selector, plugin_name }, context) {
    try {
      const result = await PenPal.API.Services.GetEnrichmentFiles(
        service_selector,
        plugin_name
      );

      return result;
    } catch (error) {
      return {
        files: [],
        error: error.message,
      };
    }
  },

  async generateEnrichmentFileDownloadUrl(
    parent,
    { file_id, expiry_seconds = 3600 },
    context
  ) {
    try {
      const result =
        await PenPal.API.Services.GenerateEnrichmentFileDownloadUrl(
          file_id,
          expiry_seconds
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
