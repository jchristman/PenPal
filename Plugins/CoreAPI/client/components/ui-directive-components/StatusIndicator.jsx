import React from "react";
import { Components, registerComponent } from "@penpal/core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const { Badge } = Components;

const StatusIndicator = ({
  status,
  color = "default",
  label,
  size = "small",
}) => {
  const getIcon = () => {
    const iconProps = { className: "h-5 w-5" };
    switch (color) {
      case "success":
        return <CheckCircleIcon {...iconProps} />;
      case "error":
        return <ExclamationCircleIcon {...iconProps} />;
      case "warning":
        return <ExclamationTriangleIcon {...iconProps} />;
      case "info":
        return <InformationCircleIcon {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <Badge
      label={label || status}
      color={color}
      size={size}
      icon={getIcon()}
      variant="filled"
    />
  );
};

registerComponent("UIDirectiveStatusIndicator", StatusIndicator);

export default StatusIndicator;
