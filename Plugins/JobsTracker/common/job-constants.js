// Job Status Constants - Shared between client and server
export const JobStatus = {
  PENDING: "pending",
  RUNNING: "running",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

// Define which statuses are considered "completed" (finished)
export const COMPLETED_STATUSES = [
  JobStatus.DONE,
  JobStatus.FAILED,
  JobStatus.CANCELLED,
];

// Define which statuses are considered "active" (running/working)
export const ACTIVE_STATUSES = [JobStatus.RUNNING, JobStatus.IN_PROGRESS];

// Validation function for job status
export const validateStatus = (status) => {
  const validStatuses = Object.values(JobStatus);
  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid job status: ${status}. Valid statuses are: ${validStatuses.join(
        ", "
      )}`
    );
  }
  return status;
};

// Helper function to check if a status is completed
export const isStatusCompleted = (status) => {
  return COMPLETED_STATUSES.includes(status);
};

// Helper function to check if a status is active
export const isStatusActive = (status) => {
  return !COMPLETED_STATUSES.includes(status);
};

// Helper function to check if a status is currently running/working
export const isStatusWorking = (status) => {
  return ACTIVE_STATUSES.includes(status);
};
