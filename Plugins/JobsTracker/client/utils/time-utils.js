// Time utility functions for JobsTracker

/**
 * Formats the runtime duration between a start and end time.
 * If the end time is not provided, it calculates the duration from the start time to now.
 * @param {string | Date} startTime - The start time.
 * @param {string | Date} [endTime] - The end time (optional).
 * @returns {string} The formatted runtime string (e.g., "5m 12s").
 */
export const formatRuntime = (startTime, endTime) => {
  if (!startTime) return "0s";

  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  let diffMs = end - start;

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
 * @param {string | Date} timestamp - The timestamp to format.
 * @returns {string} The formatted relative time string.
 */
export const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;

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
 * @param {string | Date} updatedAt - The last update timestamp.
 * @param {number} [minutes=10] - The threshold in minutes to be considered stale.
 * @returns {boolean} True if the job is stale, false otherwise.
 */
export const isJobStale = (updatedAt, minutes = 10) => {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffMs = now - updated;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  return diffMinutes >= minutes;
};

/**
 * Formats a completion timestamp into a readable string.
 * Returns an empty string if the timestamp is not provided.
 * @param {string | Date} timestamp - The completion timestamp.
 * @returns {string} The formatted completion time string.
 */
export const formatCompletionTime = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (isNaN(date)) return ""; // Return empty string for invalid dates

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
