import React from "react";
import { registerComponent } from "@penpal/core";

const formatBytes = (bytes: any, decimals = 2) => {
  if (bytes === undefined || bytes === null || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const formatDuration = (ms: any) => {
  if (ms === undefined || ms === null) return "";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60 * 1000) return `${(ms / 1000).toFixed(1)} s`;
  if (ms < 60 * 60 * 1000) return `${(ms / (1000 * 60)).toFixed(1)} min`;
  return `${(ms / (1000 * 60 * 60)).toFixed(1)} h`;
};

interface MetricProps {
  value: any;
  unit: string;
}

const Metric: React.FC<MetricProps> = ({ value, unit }) => {
  let formattedValue;

  switch (unit) {
    case "bytes":
      formattedValue = formatBytes(value);
      break;
    case "duration":
      formattedValue = formatDuration(value);
      break;
    case "items":
      formattedValue = `${value} ${value === 1 ? "item" : "items"}`;
      break;
    default:
      formattedValue = unit ? `${value} ${unit}` : value;
      break;
  }

  return <p className="text-sm text-muted-foreground">{formattedValue}</p>;
};

registerComponent("UIDirectiveMetric", Metric);

export default Metric;
