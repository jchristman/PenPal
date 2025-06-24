// File attachment types and constants for enrichment file attachments

export const FileAttachmentType = {
  // Images/Screenshots
  SCREENSHOT: "screenshot",
  IMAGE: "image",

  // Documents
  PDF: "pdf",
  TEXT: "text",
  LOG: "log",

  // Data formats
  JSON: "json",
  XML: "xml",
  HTML: "html",
  CSV: "csv",

  // Security specific
  CERTIFICATE: "certificate",
  KEY: "key",
  REPORT: "report",

  // Generic
  OTHER: "other",
};

export const FileAttachmentCategory = {
  EVIDENCE: "evidence", // Screenshots, logs, reports
  DOCUMENTATION: "documentation", // PDFs, text files
  DATA: "data", // JSON, XML, CSV
  SECURITY: "security", // Certificates, keys
  OTHER: "other",
};

// File type mappings based on MIME types and extensions
export const FILE_TYPE_MAPPINGS = {
  // Images
  "image/png": FileAttachmentType.SCREENSHOT,
  "image/jpeg": FileAttachmentType.SCREENSHOT,
  "image/jpg": FileAttachmentType.SCREENSHOT,
  "image/webp": FileAttachmentType.SCREENSHOT,
  "image/gif": FileAttachmentType.IMAGE,

  // Documents
  "application/pdf": FileAttachmentType.PDF,
  "text/plain": FileAttachmentType.TEXT,
  "text/html": FileAttachmentType.HTML,
  "text/xml": FileAttachmentType.XML,
  "application/xml": FileAttachmentType.XML,
  "text/csv": FileAttachmentType.CSV,
  "application/csv": FileAttachmentType.CSV,

  // Data
  "application/json": FileAttachmentType.JSON,

  // Security
  "application/x-x509-ca-cert": FileAttachmentType.CERTIFICATE,
  "application/x-pem-file": FileAttachmentType.CERTIFICATE,
};

// Extension to type mappings (fallback if MIME type not available)
export const EXTENSION_TYPE_MAPPINGS = {
  // Images
  ".png": FileAttachmentType.SCREENSHOT,
  ".jpg": FileAttachmentType.SCREENSHOT,
  ".jpeg": FileAttachmentType.SCREENSHOT,
  ".webp": FileAttachmentType.SCREENSHOT,
  ".gif": FileAttachmentType.IMAGE,

  // Documents
  ".pdf": FileAttachmentType.PDF,
  ".txt": FileAttachmentType.TEXT,
  ".log": FileAttachmentType.LOG,
  ".html": FileAttachmentType.HTML,
  ".htm": FileAttachmentType.HTML,
  ".xml": FileAttachmentType.XML,
  ".csv": FileAttachmentType.CSV,

  // Data
  ".json": FileAttachmentType.JSON,

  // Security
  ".crt": FileAttachmentType.CERTIFICATE,
  ".cer": FileAttachmentType.CERTIFICATE,
  ".pem": FileAttachmentType.CERTIFICATE,
  ".key": FileAttachmentType.KEY,
};

// Category mappings
export const TYPE_TO_CATEGORY_MAPPINGS = {
  [FileAttachmentType.SCREENSHOT]: FileAttachmentCategory.EVIDENCE,
  [FileAttachmentType.IMAGE]: FileAttachmentCategory.EVIDENCE,
  [FileAttachmentType.LOG]: FileAttachmentCategory.EVIDENCE,
  [FileAttachmentType.REPORT]: FileAttachmentCategory.EVIDENCE,

  [FileAttachmentType.PDF]: FileAttachmentCategory.DOCUMENTATION,
  [FileAttachmentType.TEXT]: FileAttachmentCategory.DOCUMENTATION,
  [FileAttachmentType.HTML]: FileAttachmentCategory.DOCUMENTATION,

  [FileAttachmentType.JSON]: FileAttachmentCategory.DATA,
  [FileAttachmentType.XML]: FileAttachmentCategory.DATA,
  [FileAttachmentType.CSV]: FileAttachmentCategory.DATA,

  [FileAttachmentType.CERTIFICATE]: FileAttachmentCategory.SECURITY,
  [FileAttachmentType.KEY]: FileAttachmentCategory.SECURITY,

  [FileAttachmentType.OTHER]: FileAttachmentCategory.OTHER,
};

// Helper functions
export const detectFileType = (filename, mimeType) => {
  // Try MIME type first
  if (mimeType && FILE_TYPE_MAPPINGS[mimeType]) {
    return FILE_TYPE_MAPPINGS[mimeType];
  }

  // Fall back to extension
  if (filename) {
    const extension = filename
      .toLowerCase()
      .substring(filename.lastIndexOf("."));
    if (EXTENSION_TYPE_MAPPINGS[extension]) {
      return EXTENSION_TYPE_MAPPINGS[extension];
    }
  }

  return FileAttachmentType.OTHER;
};

export const getFileCategory = (fileType) => {
  return TYPE_TO_CATEGORY_MAPPINGS[fileType] || FileAttachmentCategory.OTHER;
};

export const validateFileType = (fileType) => {
  const validTypes = Object.values(FileAttachmentType);
  if (!validTypes.includes(fileType)) {
    throw new Error(
      `Invalid file type: ${fileType}. Valid: ${validTypes.join(", ")}`
    );
  }
  return fileType;
};

export const validateFileCategory = (category) => {
  const validCategories = Object.values(FileAttachmentCategory);
  if (!validCategories.includes(category)) {
    throw new Error(
      `Invalid file category: ${category}. Valid: ${validCategories.join(", ")}`
    );
  }
  return category;
};

// Standard bucket naming for enrichment files
export const getEnrichmentFileBucket = (projectId, pluginName) => {
  return `enrichments-${projectId}-${pluginName.toLowerCase()}`;
};
