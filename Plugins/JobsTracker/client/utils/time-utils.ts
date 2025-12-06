// Time utility functions for JobsTracker

/**
 * Formats the runtime duration between a start and end time.
 * If the end time is not provided, it calculates the duration from the start time to now.
 */
export const formatRuntime = (startTime: string | Date, endTime?: string | Date): string => {
  if (!startTime) return "0s";

  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  let diffMs = end.getTime() - start.getTime();

  if (isNaN(diffMs) || diffMs < 0) return "0s";

  let diffSeconds = Math.floor(diffMs / 1000);
  let diffMinutes = Math.floor(diffSeconds / 60);
  let diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  diffHours %= 24;
  diffMinutes %= 60;
  diffSeconds %= 60;

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds}s`;
  }
  return `${diffSeconds}s`;
};

/**
 * Formats a timestamp into a relative time string (e.g., "5m ago").
 */
export const formatRelativeTime = (timestamp: string | Date): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();

  if (diffMs < 0) return "just now";

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  } else if (diffSeconds > 30) {
    return `${diffSeconds}s ago`;
  } else {
    return "just now";
  }
};

/**
 * Checks if a job is stale based on its last update time.
 */
export const isJobStale = (updatedAt: string | Date, minutes: number = 10): boolean => {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffMs = now.getTime() - updated.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  return diffMinutes >= minutes;
};

/**
 * Formats a completion timestamp into a readable string.
 * Returns an empty string if the timestamp is not provided.
 */
export const formatCompletionTime = (timestamp: string | Date): string => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return ""; // Return empty string for invalid dates

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    // If today, just show time
    return `at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } else {
    // If not today, show date and time
    return `on ${date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    })}`;
  }
};
