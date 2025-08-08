import React from "react";
import { Components, registerComponent } from "@penpal/core";

const { Badge: _Badge } = Components;

const Badge = ({
  label,
  color = "default",
  size = "small",
  variant = "filled",
  icon,
  items,
  maxItems = 5,
  expandable = false,
  value = null,
}) => {
  if (Array.isArray(items)) {
    const displayedItems = expandable ? items.slice(0, maxItems) : items;
    const remainingCount = items.length - displayedItems.length;

    return (
      <>
        {displayedItems.map((item, index) => (
          <_Badge
            key={index}
            label={item}
            color={color}
            size={size}
            variant={variant}
            icon={icon}
          >
            {item}
          </_Badge>
        ))}
        {expandable && remainingCount > 0 && (
          <_Badge
            label={`+${remainingCount} more`}
            size={size}
            variant="outlined"
          >
            {`+${remainingCount} more`}
          </_Badge>
        )}
      </>
    );
  }

  return (
    <_Badge
      label={label}
      color={color}
      size={size}
      variant={variant}
      icon={icon}
    >
      {value}
    </_Badge>
  );
};

registerComponent("UIDirectiveBadge", Badge);

export default Badge;
