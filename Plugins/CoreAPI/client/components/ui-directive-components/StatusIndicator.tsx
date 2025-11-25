import React from "react";
import { Components, registerComponent } from "@penpal/core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const { Badge } = Components;

interface StatusIndicatorProps {
  status: string;
  color?: string;
  label?: string;
  size?: string;
  value?: any;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  color = "default",
  label,
  size = "small",
  value,
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
    <Badge color={color} size={size} icon={getIcon()} variant="filled">
      {label || value}
    </Badge>
  );
};

registerComponent("UIDirectiveStatusIndicator", StatusIndicator);

export default StatusIndicator;
