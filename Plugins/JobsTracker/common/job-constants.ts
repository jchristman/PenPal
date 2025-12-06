// Job Status Constants - Shared between client and server
export const JobStatus = {
  PENDING: "pending",
  RUNNING: "running",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type JobStatusType = typeof JobStatus[keyof typeof JobStatus];

// Define which statuses are considered "completed" (finished)
export const COMPLETED_STATUSES: JobStatusType[] = [
  JobStatus.DONE,
  JobStatus.FAILED,
  JobStatus.CANCELLED,
];

// Define which statuses are considered "active" (running/working)
export const ACTIVE_STATUSES: JobStatusType[] = [JobStatus.RUNNING, JobStatus.IN_PROGRESS];

// Validation function for job status
export const validateStatus = (status: string): JobStatusType => {
  const validStatuses = Object.values(JobStatus);
  if (!validStatuses.includes(status as JobStatusType)) {
    throw new Error(
      `Invalid job status: ${status}. Valid statuses are: ${validStatuses.join(
        ", "
      )}`
    );
  }
  return status as JobStatusType;
};

// Helper function to check if a status is completed
export const isStatusCompleted = (status: JobStatusType): boolean => {
  return COMPLETED_STATUSES.includes(status);
};

// Helper function to check if a status is active
export const isStatusActive = (status: JobStatusType): boolean => {
  return !COMPLETED_STATUSES.includes(status);
};

// Helper function to check if a status is currently running/working
export const isStatusWorking = (status: JobStatusType): boolean => {
  return ACTIVE_STATUSES.includes(status);
};
