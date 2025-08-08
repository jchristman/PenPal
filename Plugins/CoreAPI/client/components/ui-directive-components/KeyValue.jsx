import React from "react";
import { Components, registerComponent } from "@penpal/core";

const KeyValue = ({
  value,
  keyLabel = "Key",
  valueLabel = "Value",
  orientation = "horizontal", // horizontal, vertical
  spacing = "normal", // compact, normal, loose
  maxItems = 10,
  expandable = true,
  className = "",
  ...props
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!value) return null;

  // Convert different value types to key-value pairs
  const getKeyValuePairs = (data) => {
    if (Array.isArray(data)) {
      // Array of objects or simple array with indices
      return data.map((item, index) => {
        if (typeof item === "object" && item !== null) {
          // Object in array - use first property as key, rest as value
          const entries = Object.entries(item);
          if (entries.length > 0) {
            const [firstKey, firstValue] = entries[0];
            return {
              key: firstKey,
              value: entries.length === 1 ? firstValue : item,
            };
          }
        }
        return { key: index.toString(), value: item };
      });
    } else if (typeof data === "object" && data !== null) {
      // Regular object
      return Object.entries(data).map(([key, value]) => ({ key, value }));
    } else {
      // Primitive value
      return [{ key: keyLabel, value: data }];
    }
  };

  const pairs = getKeyValuePairs(value);
  const shouldTruncate = expandable && pairs.length > maxItems;
  const displayPairs =
    shouldTruncate && !isExpanded ? pairs.slice(0, maxItems) : pairs;

  const spacingClasses = {
    compact: "gap-1",
    normal: "gap-2",
    loose: "gap-4",
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    if (Array.isArray(val)) return val.join(", ");
    return String(val);
  };

  if (orientation === "vertical") {
    return (
      <div className={`space-y-3 ${className}`} {...props}>
        {displayPairs.map(({ key, value }, index) => (
          <div key={index} className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {key}
            </div>
            <div className="text-sm break-words">{formatValue(value)}</div>
          </div>
        ))}

        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {isExpanded
              ? `Show less (${pairs.length - maxItems} hidden)`
              : `Show all ${pairs.length} items`}
          </button>
        )}
      </div>
    );
  }

  // Horizontal orientation (default)
  return (
    <div className={`space-y-1 ${className}`} {...props}>
      {displayPairs.map(({ key, value }, index) => (
        <div
          key={index}
          className={`flex justify-between items-start ${spacingClasses[spacing]}`}
        >
          <div className="text-xs font-medium text-muted-foreground capitalize flex-shrink-0 min-w-0 mr-2">
            {key.replace(/_/g, " ")}:
          </div>
          <div className="text-sm text-right break-words min-w-0 flex-1">
            {formatValue(value)}
          </div>
        </div>
      ))}

      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-800 underline w-full text-left"
        >
          {isExpanded
            ? `Show less (${pairs.length - maxItems} hidden)`
            : `Show all ${pairs.length} items`}
        </button>
      )}
    </div>
  );
};

registerComponent("UIDirectiveKeyValue", KeyValue);

export default KeyValue;
