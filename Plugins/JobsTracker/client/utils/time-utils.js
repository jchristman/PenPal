// Time utility functions for JobsTracker

export const formatRuntime = (createdAt, updatedAt) => {
  const start = new Date(createdAt);
  const end = new Date(updatedAt);
  const diffMs = end - start;

  if (diffMs < 0) return "0s";

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds % 60}s`;
  } else {
    return `${diffSeconds}s`;
  }
};

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

export const isJobStale = (updatedAt, minutes = 10) => {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffMs = now - updated;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  return diffMinutes >= minutes;
};

export const formatCompletionTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    // If today, just show time
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    // If not today, show date and time
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};
