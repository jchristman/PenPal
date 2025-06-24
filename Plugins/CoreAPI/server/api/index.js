import "./topics.js";

export {
  getCustomer,
  getCustomers,
  insertCustomer,
  insertCustomers,
  updateCustomer,
  updateCustomers,
  upsertCustomers,
  removeCustomer,
  removeCustomers,
} from "./customers.js";

export {
  getProject,
  getProjects,
  getProjectsPaginationInfo,
  insertProject,
  insertProjects,
  updateProject,
  updateProjects,
  upsertProjects,
  removeProject,
  removeProjects,
} from "./projects.js";

export {
  getHost,
  getHosts,
  getHostsPaginationInfo,
  getHostsByProject,
  getHostsByNetwork,
  getHostsByNetworks,
  insertHost,
  insertHosts,
  updateHost,
  updateHosts,
  upsertHosts,
  removeHost,
  removeHosts,
} from "./hosts.js";

export {
  getNetwork,
  getNetworks,
  getNetworksPaginationInfo,
  getNetworksByProject,
  insertNetwork,
  insertNetworks,
  updateNetwork,
  updateNetworks,
  removeNetwork,
  removeNetworks,
} from "./networks.js";

export {
  getService,
  getServices,
  getServicesPaginationInfo,
  getServicesByProject,
  getServicesByNetwork,
  getServicesByHost,
  getServicesByHosts,
  insertService,
  insertServices,
  updateService,
  updateServices,
  upsertServices,
  removeService,
  removeServices,
  // Enrichment Management Functions
  addEnrichment,
  addEnrichments,
  updateEnrichment,
  upsertEnrichment,
  removeEnrichment,
  // File Attachment Functions
  attachFileToEnrichment,
  getEnrichmentFiles,
  removeFileFromEnrichment,
  generateEnrichmentFileDownloadUrl,
} from "./services.js";

// Enrichment File Helper Functions
export {
  attachScreenshotToHttpXEnrichment,
  attachCertificateToEnrichment,
  attachLogToEnrichment,
  attachJsonReportToEnrichment,
  getEnrichmentFilesByType,
  getEnrichmentScreenshots,
  getEnrichmentCertificates,
  getEnrichmentLogs,
} from "./enrichment-file-helpers.js";
