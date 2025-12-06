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
} from "./customers.ts";

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
} from "./projects.ts";

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
} from "./hosts.ts";

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
} from "./networks.ts";

export {
  getDomain,
  getDomains,
  getDomainsPaginationInfo,
  getDomainsByProject,
  insertDomain,
  insertDomains,
  updateDomain,
  updateDomains,
  removeDomain,
  removeDomains,
  resolveDomain,
  resolveDomains,
} from "./domains.ts";

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
} from "./services.ts";

// Enrichment File Helper Functions
export {
  attachScreenshotToEnrichment,
  attachCertificateToEnrichment,
  attachLogToEnrichment,
  attachJsonReportToEnrichment,
  getEnrichmentFilesByType,
  getEnrichmentScreenshots,
  getEnrichmentCertificates,
  getEnrichmentLogs,
} from "./enrichment-file-helpers.ts";

export {
  getVulnerability,
  getVulnerabilities,
  getVulnerabilitiesByProjectID,
  getVulnerabilitiesByHostID,
  getVulnerabilitiesByServiceID,
  insertVulnerability,
  insertVulnerabilities,
  updateVulnerability,
  updateVulnerabilities,
  upsertVulnerabilities,
  removeVulnerability,
  removeVulnerabilities,
} from "./vulnerabilities.ts";
