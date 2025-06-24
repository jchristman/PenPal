// Helper functions for common enrichment file attachment scenarios
import PenPal from "#penpal/core";
import {
  FileAttachmentType,
  FileAttachmentCategory,
} from "../../common/file-attachment-constants.js";

/**
 * Attach a screenshot to an HttpX enrichment
 * This is a convenience function for the most common use case
 */
export const attachScreenshotToHttpXEnrichment = async (
  service_selector,
  screenshot_buffer,
  screenshot_filename,
  metadata = {}
) => {
  const file_data = {
    filename: screenshot_filename,
    buffer: screenshot_buffer,
    mimeType: "image/png",
  };

  const file_metadata = {
    type: FileAttachmentType.SCREENSHOT,
    category: FileAttachmentCategory.EVIDENCE,
    description: "Web page screenshot",
    ...metadata,
  };

  return await PenPal.API.Services.AttachFileToEnrichment(
    service_selector,
    "HttpX",
    file_data,
    file_metadata
  );
};

/**
 * Attach a certificate file to a service enrichment
 */
export const attachCertificateToEnrichment = async (
  service_selector,
  plugin_name,
  certificate_buffer,
  certificate_filename,
  metadata = {}
) => {
  const file_data = {
    filename: certificate_filename,
    buffer: certificate_buffer,
    mimeType: "application/x-pem-file",
  };

  const file_metadata = {
    type: FileAttachmentType.CERTIFICATE,
    category: FileAttachmentCategory.SECURITY,
    description: "SSL/TLS Certificate",
    ...metadata,
  };

  return await PenPal.API.Services.AttachFileToEnrichment(
    service_selector,
    plugin_name,
    file_data,
    file_metadata
  );
};

/**
 * Attach a log file to any enrichment
 */
export const attachLogToEnrichment = async (
  service_selector,
  plugin_name,
  log_content,
  log_filename,
  metadata = {}
) => {
  const file_data = {
    filename: log_filename,
    buffer: Buffer.from(log_content, "utf8"),
    mimeType: "text/plain",
  };

  const file_metadata = {
    type: FileAttachmentType.LOG,
    category: FileAttachmentCategory.EVIDENCE,
    description: "Tool execution log",
    ...metadata,
  };

  return await PenPal.API.Services.AttachFileToEnrichment(
    service_selector,
    plugin_name,
    file_data,
    file_metadata
  );
};

/**
 * Attach a JSON report to any enrichment
 */
export const attachJsonReportToEnrichment = async (
  service_selector,
  plugin_name,
  json_data,
  report_filename,
  metadata = {}
) => {
  const file_data = {
    filename: report_filename,
    buffer: Buffer.from(JSON.stringify(json_data, null, 2), "utf8"),
    mimeType: "application/json",
  };

  const file_metadata = {
    type: FileAttachmentType.JSON,
    category: FileAttachmentCategory.DATA,
    description: "Tool output report",
    ...metadata,
  };

  return await PenPal.API.Services.AttachFileToEnrichment(
    service_selector,
    plugin_name,
    file_data,
    file_metadata
  );
};

/**
 * Get all files for a specific enrichment with file type filtering
 */
export const getEnrichmentFilesByType = async (
  service_selector,
  plugin_name,
  file_types = []
) => {
  const result = await PenPal.API.Services.GetEnrichmentFiles(
    service_selector,
    plugin_name
  );

  if (result.error || !result.files) {
    return result;
  }

  if (file_types.length === 0) {
    return result;
  }

  // Filter by file types
  const filtered_files = result.files.filter((file) =>
    file_types.includes(file.file_type)
  );

  return {
    files: filtered_files,
  };
};

/**
 * Get all screenshots for an enrichment
 */
export const getEnrichmentScreenshots = async (
  service_selector,
  plugin_name
) => {
  return await getEnrichmentFilesByType(service_selector, plugin_name, [
    FileAttachmentType.SCREENSHOT,
    FileAttachmentType.IMAGE,
  ]);
};

/**
 * Get all certificates for an enrichment
 */
export const getEnrichmentCertificates = async (
  service_selector,
  plugin_name
) => {
  return await getEnrichmentFilesByType(service_selector, plugin_name, [
    FileAttachmentType.CERTIFICATE,
  ]);
};

/**
 * Get all logs for an enrichment
 */
export const getEnrichmentLogs = async (service_selector, plugin_name) => {
  return await getEnrichmentFilesByType(service_selector, plugin_name, [
    FileAttachmentType.LOG,
  ]);
};
