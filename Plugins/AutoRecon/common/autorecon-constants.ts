// AutoRecon plugin constants - shared between client and server

export const AutoReconTools = {
  FINDOMAIN: "findomain",
  SUBFINDER: "subfinder",
  AMASS: "amass",
  CRTSH: "crtsh",
  ASSETFINDER: "assetfinder",
} as const;

export type AutoReconTool = typeof AutoReconTools[keyof typeof AutoReconTools];

export const AutoReconToolDefaults: Record<AutoReconTool, boolean> = {
  [AutoReconTools.FINDOMAIN]: true,
  [AutoReconTools.SUBFINDER]: true,
  [AutoReconTools.AMASS]: false,
  [AutoReconTools.CRTSH]: true,
  [AutoReconTools.ASSETFINDER]: true,
} as const;

export const AutoReconConfigOptions = {
  RECURSIVE: "recursive",
  SCAN_ALL_DOMAINS: "scanAllDomains",
} as const;

export type AutoReconConfigOption = typeof AutoReconConfigOptions[keyof typeof AutoReconConfigOptions];

export const AutoReconConfigDefaults: Record<AutoReconConfigOption, boolean> = {
  [AutoReconConfigOptions.RECURSIVE]: false,
  [AutoReconConfigOptions.SCAN_ALL_DOMAINS]: false,
} as const;

export const AutoReconStatus = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type AutoReconStatusType = typeof AutoReconStatus[keyof typeof AutoReconStatus];

// Job stages for AutoRecon
export const AutoReconStages = {
  SUBDOMAIN_ENUM: "subdomain-enumeration",
  RESULTS_PROCESSING: "results-processing",
} as const;

export type AutoReconStage = typeof AutoReconStages[keyof typeof AutoReconStages];

export const AutoReconStageLabels: Record<AutoReconStage, string> = {
  [AutoReconStages.SUBDOMAIN_ENUM]: "Subdomain Enumeration",
  [AutoReconStages.RESULTS_PROCESSING]: "Processing Results",
} as const;
