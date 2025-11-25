import React from "react";
import { Components, registerComponent } from "@penpal/core";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

type CollapsibleVariant = "default" | "card" | "minimal";

interface CollapsibleFieldProps {
  value: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  variant?: CollapsibleVariant;
  showIcon?: boolean;
  maxHeight?: string;
  renderContent?: (value: any) => React.ReactNode;
  className?: string;
  [key: string]: any;
}

interface VariantStyles {
  container: string;
  header: string;
  content: string;
}

type VariantStylesMap = Record<CollapsibleVariant, VariantStyles>;

const CollapsibleField: React.FC<CollapsibleFieldProps> = ({
  value,
  title,
  defaultOpen = false,
  variant = "default", // default, card, minimal
  showIcon = true,
  maxHeight = "300px",
  renderContent,
  className = "",
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (!value) return null;

  const toggleOpen = () => setIsOpen(!isOpen);

  const renderValue = () => {
    if (renderContent && typeof renderContent === "function") {
      return renderContent(value);
    }

    // Default rendering based on value type
    if (typeof value === "string") {
      return (
        <div className="text-sm whitespace-pre-wrap break-words">{value}</div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <ul className="text-sm space-y-1">
          {value.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-muted-foreground mr-2">•</span>
              <span>{String(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === "object" && value !== null) {
      return <Components.UIDirectiveJsonTree value={value} />;
    }

    return <div className="text-sm">{String(value)}</div>;
  };

  const variants: VariantStylesMap = {
    default: {
      container: "border border-gray-200 dark:border-gray-700 rounded-lg",
      header:
        "px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700",
      content: "p-4",
    },
    card: {
      container:
        "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm",
      header: "px-4 py-3 bg-gray-50 dark:bg-gray-800",
      content: "p-4",
    },
    minimal: {
      container: "",
      header: "py-2",
      content: "pl-4 pt-2",
    },
  };

  const variantClasses = variants[variant || "default"];

  return (
    <div className={`${variantClasses.container} ${className}`} {...props}>
      <button
        onClick={toggleOpen}
        className={`
          ${variantClasses.header}
          w-full flex items-center justify-between text-left
          hover:bg-gray-100 dark:hover:bg-gray-700 
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
        `}
      >
        <span className="text-sm font-medium">{title || "Details"}</span>
        {showIcon && (
          <div className="flex-shrink-0 ml-2">
            {isOpen ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className={variantClasses.content}
          style={{
            maxHeight: maxHeight,
            overflowY: maxHeight ? "auto" : "visible",
          }}
        >
          {renderValue()}
        </div>
      )}
    </div>
  );
};

registerComponent("UIDirectiveCollapsible", CollapsibleField);

export default CollapsibleField;
