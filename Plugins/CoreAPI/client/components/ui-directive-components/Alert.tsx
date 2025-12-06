import React from "react";
import { Components, registerComponent } from "@penpal/core";
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const { Card } = Components;

type AlertSeverity = "info" | "warning" | "error" | "success";

interface AlertProps {
  value: React.ReactNode;
  severity?: AlertSeverity;
  title?: string;
  icon?: React.ComponentType<any>;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  [key: string]: any;
}

interface SeverityConfig {
  bgColor: string;
  borderColor: string;
  textColor: string;
  titleColor: string;
  icon: React.ComponentType<any>;
  iconColor: string;
}

type SeverityConfigMap = Record<AlertSeverity, SeverityConfig>;

const Alert: React.FC<AlertProps> = ({
  value,
  severity = "info", // info, warning, error, success
  title,
  icon: customIcon,
  className = "",
  dismissible = false,
  onDismiss,
  ...props
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (dismissed || !value) return null;

  const severityConfig: SeverityConfigMap = {
    info: {
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-200 dark:border-blue-800",
      textColor: "text-blue-800 dark:text-blue-200",
      titleColor: "text-blue-900 dark:text-blue-100",
      icon: InformationCircleIcon,
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    warning: {
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      textColor: "text-yellow-800 dark:text-yellow-200",
      titleColor: "text-yellow-900 dark:text-yellow-100",
      icon: ExclamationTriangleIcon,
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    error: {
      bgColor: "bg-red-50 dark:bg-red-950",
      borderColor: "border-red-200 dark:border-red-800",
      textColor: "text-red-800 dark:text-red-200",
      titleColor: "text-red-900 dark:text-red-100",
      icon: XCircleIcon,
      iconColor: "text-red-600 dark:text-red-400",
    },
    success: {
      bgColor: "bg-green-50 dark:bg-green-950",
      borderColor: "border-green-200 dark:border-green-800",
      textColor: "text-green-800 dark:text-green-200",
      titleColor: "text-green-900 dark:text-green-100",
      icon: CheckCircleIcon,
      iconColor: "text-green-600 dark:text-green-400",
    },
  };

  const config = severityConfig[severity || "info"];
  const IconComponent = customIcon || config.icon;

  return (
    <div
      className={`
        ${config.bgColor} 
        ${config.borderColor} 
        border rounded-lg p-4 
        ${className}
      `}
      {...props}
    >
      <div className="flex items-start">
        <IconComponent
          className={`h-5 w-5 ${config.iconColor} mt-0.5 flex-shrink-0`}
        />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${config.textColor}`}>
            {typeof value === "string" ? (
              <p>{value}</p>
            ) : Array.isArray(value) ? (
              <ul className="list-disc list-inside space-y-1">
                {value.map((item, index) => (
                  <li key={index}>{String(item)}</li>
                ))}
              </ul>
            ) : (
              <p>{String(value)}</p>
            )}
          </div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`
              ml-auto flex-shrink-0 
              ${config.textColor} 
              hover:opacity-75 
              transition-opacity
            `}
          >
            <span className="sr-only">Dismiss</span>
            <XCircleIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

registerComponent("UIDirectiveAlert", Alert);

export default Alert;
