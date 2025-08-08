import React from "react";
import { Components, registerComponent } from "@penpal/core";

const Timestamp = ({
  value,
  format = "relative",
  className = "",
  ...props
}) => {
  if (!value) return null;
  const date = new Date(value);
  let display = value;

  if (format === "relative") {
    // Simple relative time (e.g., '2 hours ago')
    const now = Date.now();
    const diff = Math.floor((now - date.getTime()) / 1000);
    if (diff < 60) display = `${diff} seconds ago`;
    else if (diff < 3600) display = `${Math.floor(diff / 60)} minutes ago`;
    else if (diff < 86400) display = `${Math.floor(diff / 3600)} hours ago`;
    else display = `${Math.floor(diff / 86400)} days ago`;
  } else if (format === "date") {
    display = date.toLocaleDateString();
  } else if (format === "time") {
    display = date.toLocaleTimeString();
  } else if (format === "full") {
    display = date.toLocaleString();
  }

  return (
    <span className={`text-xs text-muted-foreground ${className}`} {...props}>
      {display}
    </span>
  );
};

registerComponent("UIDirectiveTimestamp", Timestamp);

export default Timestamp;
