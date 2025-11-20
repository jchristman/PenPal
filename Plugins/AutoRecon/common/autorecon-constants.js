// AutoRecon plugin constants - shared between client and server

export const AutoReconTools = {
  FINDOMAIN: "findomain",
  SUBFINDER: "subfinder",
  AMASS: "amass",
  CRTSH: "crtsh",
  ASSETFINDER: "assetfinder",
};

export const AutoReconToolDefaults = {
  [AutoReconTools.FINDOMAIN]: true,
  [AutoReconTools.SUBFINDER]: true,
  [AutoReconTools.AMASS]: false,
  [AutoReconTools.CRTSH]: true,
  [AutoReconTools.ASSETFINDER]: true,
};

export const AutoReconConfigOptions = {
  RECURSIVE: "recursive",
  SCAN_ALL_DOMAINS: "scanAllDomains",
};

export const AutoReconConfigDefaults = {
  [AutoReconConfigOptions.RECURSIVE]: false,
  [AutoReconConfigOptions.SCAN_ALL_DOMAINS]: false,
};

export const AutoReconStatus = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

// Job stages for AutoRecon
export const AutoReconStages = {
  SUBDOMAIN_ENUM: "subdomain-enumeration",
  RESULTS_PROCESSING: "results-processing",
};

export const AutoReconStageLabels = {
  [AutoReconStages.SUBDOMAIN_ENUM]: "Subdomain Enumeration",
  [AutoReconStages.RESULTS_PROCESSING]: "Processing Results",
};
